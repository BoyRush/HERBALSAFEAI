import os
import sys
import json
import string
import secrets
from datetime import datetime, timedelta
from functools import wraps

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import mysql.connector
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

groq_api_token = os.environ.get("GROQ_API_KEY", "")
if groq_api_token:
    print(f"[Engine] Groq API Token aktif: {groq_api_token[:8]}***")
else:
    print("[Engine] WARNING: GROQ_API_KEY belum dikonfigurasi di .env")

from chroma.herbal_store import add_herbal, update_herbal, delete_herbal_by_record_id, search_herbal
from rules.medical_rules import filter_herbs_by_medical_condition
from services.llm_generator import generate_herbal_recommendation
from services.herbal_retriever import retrieve_relevant_herbs

app = Flask(__name__)
CORS(app,
     resources={r"/*": {
         "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }})

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secure-jwt-secret-key-2026-smartherbal-ai-system-long")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["JWT_TOKEN_LOCATION"] = ["headers", "query_string"]
app.config["JWT_QUERY_STRING_NAME"] = "token"
token_manager = JWTManager(app)

def acquire_mysql_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "root"), 
        database=os.environ.get("DB_NAME", "herbalsafe_db"),
        port=int(os.environ.get("DB_PORT", 3306)),
        collation="utf8mb4_general_ci"
    )

def push_system_notification(target_user_id, notif_message):
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        insert_query = "INSERT INTO sh_notifications (user_id, pesan, is_read, tanggal) VALUES (%s, %s, FALSE, NOW())"
        db_cursor.execute(insert_query, (target_user_id, notif_message))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
    except Exception as e:
        print(f"Gagal mengirim notifikasi: {e}")

@app.route("/herbal/recommendation-input", methods=["POST"])
@jwt_required()
def process_ai_rag_request():
    active_session = json.loads(get_jwt_identity())
    print(f"[DEBUG] Role dari JWT: '{active_session.get('role')}'")
    if active_session.get('role') != 'patient':
        return jsonify({"error": f"Akses ditolak. Role Anda: {active_session.get('role')}. Fitur khusus pasien."}), 403
        
    payload = request.get_json() or {}
    symptoms_text = payload.get("keluhan", "").strip()
    use_rag = payload.get("useRag", True)
    
    if not symptoms_text:
        return jsonify({"error": "Teks keluhan tidak boleh kosong"}), 400
        
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        patient_data = db_cursor.fetchone()
        
        if not patient_data:
            db_cursor.close()
            db_conn.close()
            return jsonify({"error": "Profil pasien tidak ditemukan. Silakan hubungi admin."}), 404
        
        patient_history = []
        try:
            db_cursor.execute("SELECT diagnosis, symptoms, notes FROM medical_records WHERE patient_id = %s ORDER BY created_at DESC", (patient_data['id'],))
            patient_history = db_cursor.fetchall()
        except Exception as med_err:
            print(f"[WARNING] Gagal ambil riwayat medis: {med_err}")
        
        ai_response = generate_herbal_recommendation(symptoms_text, patient_history, use_rag=use_rag)
        
        try:
            db_cursor.execute(
                "INSERT INTO sh_riwayat_rekomendasi (patient_id, keluhan, hasil_ai) VALUES (%s, %s, %s)",
                (patient_data['id'], symptoms_text, json.dumps(ai_response))
            )
            db_cursor.execute("UPDATE users SET recommendation_count = recommendation_count + 1 WHERE id = %s", (active_session['id'],))
            db_conn.commit()
        except Exception as db_err:
            print(f"[WARNING] Gagal simpan riwayat: {db_err}")
        
        db_cursor.close()
        db_conn.close()
        
        return jsonify({"status": "success", "data": ai_response}), 200
        
    except Exception as error_msg:
        print("Crash pada RAG Engine:", error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(error_msg)}), 500
        
@app.route("/herbal/history", methods=["GET"])
@jwt_required()
def fetch_ai_history():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'patient':
        return jsonify({"error": "Tidak diizinkan"}), 403
        
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        patient_data = db_cursor.fetchone()
        
        db_cursor.execute("SELECT * FROM sh_riwayat_rekomendasi WHERE patient_id = %s ORDER BY tanggal DESC", (patient_data['id'],))
        history_records = db_cursor.fetchall()
        
        for record in history_records:
            record['tanggal'] = record['tanggal'].isoformat()
            if isinstance(record['hasil_ai'], str):
                record['hasil_ai'] = json.loads(record['hasil_ai'])
                
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "history": history_records}), 200
    except Exception as error_msg:
        return jsonify({"error": str(error_msg)}), 500

@app.route("/herbal/all", methods=["GET"])
@jwt_required()
def retrieve_all_herbals():
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("""
            SELECT hc.*, u.full_name as doctor_name 
            FROM herbal_catalogs hc 
            JOIN doctors d ON hc.doctor_id = d.id 
            JOIN users u ON d.user_id = u.id
            WHERE hc.is_active = TRUE ORDER BY hc.created_at DESC
        """)
        herbal_items = db_cursor.fetchall()
        for item in herbal_items: 
            item['created_at'] = item['created_at'].isoformat()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "herbals": herbal_items}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/herbal/store", methods=["POST"])
@jwt_required()
def save_new_herbal():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'herbal_doctor': 
        return jsonify({"error": "Hanya untuk Dokter Herbal"}), 403
    payload = request.get_json() or {}
    
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        doctor_profile = db_cursor.fetchone()
        
        db_cursor.execute(
            "INSERT INTO herbal_catalogs (doctor_id, nama, indikasi, kontraindikasi, deskripsi) VALUES (%s, %s, %s, %s, %s)",
            (doctor_profile['id'], payload.get("nama"), payload.get("indikasi"), payload.get("kontraindikasi"), payload.get("deskripsi"))
        )
        new_record_id = db_cursor.lastrowid
        
        chroma_uuid = add_herbal(new_record_id, payload.get("nama"), payload.get("indikasi"), payload.get("kontraindikasi"), payload.get("deskripsi"), doctor_profile['id'])
        
        db_cursor.execute("UPDATE herbal_catalogs SET chroma_doc_id = %s WHERE id = %s", (chroma_uuid, new_record_id))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        
        return jsonify({"status": "success", "id": new_record_id}), 201
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/herbal/update/<int:herbal_id>", methods=["PUT"])
@jwt_required()
def modify_herbal_data(herbal_id):
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'herbal_doctor':
        return jsonify({"error": "Hanya untuk Dokter Herbal"}), 403
    payload = request.get_json() or {}
    
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        doc_profile = db_cursor.fetchone()

        db_cursor.execute("SELECT * FROM herbal_catalogs WHERE id = %s AND doctor_id = %s", (herbal_id, doc_profile['id']))
        existing_herbal = db_cursor.fetchone()
        if not existing_herbal:
            return jsonify({"error": "Herbal tidak ditemukan atau Anda tidak memiliki akses"}), 404

        v_nama = payload.get("nama", existing_herbal['nama'])
        v_ind = payload.get("indikasi", existing_herbal['indikasi'])
        v_kontra = payload.get("kontraindikasi", existing_herbal['kontraindikasi'])
        v_desc = payload.get("deskripsi", existing_herbal.get('deskripsi', ''))

        db_cursor.execute(
            "UPDATE herbal_catalogs SET nama=%s, indikasi=%s, kontraindikasi=%s, deskripsi=%s WHERE id=%s",
            (v_nama, v_ind, v_kontra, v_desc, herbal_id)
        )
        
        new_chroma_id = update_herbal(herbal_id, v_nama, v_ind, v_kontra, v_desc, doc_profile['id'])
        db_cursor.execute("UPDATE herbal_catalogs SET chroma_doc_id = %s WHERE id = %s", (new_chroma_id, herbal_id))
        
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "message": "Pembaruan herbal berhasil."}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/herbal/delete/<int:herbal_id>", methods=["DELETE"])
@jwt_required()
def remove_herbal_data(herbal_id):
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'herbal_doctor': 
        return jsonify({"error": "Akses ditolak"}), 403
        
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        doc_profile = db_cursor.fetchone()
        
        db_cursor.execute("UPDATE herbal_catalogs SET is_active = FALSE WHERE id = %s AND doctor_id = %s", (herbal_id, doc_profile['id']))
        
        delete_herbal_by_record_id(herbal_id) 
        
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/access/search-patient", methods=["GET"])
@jwt_required()
def lookup_patient_by_name():
    keyword = request.args.get("q")
    if not keyword: 
        return jsonify([])
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        search_query = "SELECT u.id, u.full_name, u.username FROM users u JOIN patients p ON u.id = p.user_id WHERE u.full_name LIKE %s LIMIT 10"
        db_cursor.execute(search_query, (f"%{keyword}%",))
        patient_list = db_cursor.fetchall()
        db_cursor.close()
        db_conn.close()
        return jsonify(patient_list)
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/access/request", methods=["POST"])
@jwt_required()
def initiate_access_request():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['doctor', 'herbal_doctor']: 
        return jsonify({"error": "Terbatas untuk dokter"}), 403
    
    payload = request.get_json() or {}
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)

        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        doctor_profile = db_cursor.fetchone()
        if not doctor_profile:
            db_cursor.close(); db_conn.close()
            return jsonify({"error": "Profil dokter tidak ditemukan. Pastikan akun dokter sudah terdaftar."}), 404

        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (payload.get("patient_user_id"),))
        patient_profile = db_cursor.fetchone()
        if not patient_profile:
            db_cursor.close(); db_conn.close()
            return jsonify({"error": "Pasien tidak ditemukan. Pastikan ID pasien yang dimasukkan benar."}), 404
        
        db_cursor.execute("""
            INSERT INTO access_permissions (patient_id, doctor_id, status, requested_at) VALUES (%s, %s, 'pending', NOW())
            ON DUPLICATE KEY UPDATE status = 'pending', requested_at = NOW()
        """, (patient_profile['id'], doctor_profile['id']))

        # Kirim notifikasi ke pasien
        db_cursor.execute("SELECT full_name FROM users WHERE id = %s", (active_session['id'],))
        doc_user = db_cursor.fetchone()
        doc_name = doc_user['full_name'] if doc_user else 'Dokter'
        push_system_notification(payload.get("patient_user_id"), f"Dr. {doc_name} meminta akses ke rekam medis Anda. Silakan buka tab Notifikasi untuk merespons.")

        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "message": "Permintaan akses berhasil dikirim ke pasien."}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/access/search-patient", methods=["GET"])
@jwt_required()
def search_patient_by_name():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Akses terbatas untuk dokter"}), 403

    query_str = request.args.get("q", "").strip()
    if not query_str or len(query_str) < 2:
        return jsonify([]), 200

    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("""
            SELECT u.id, u.full_name, u.username
            FROM users u
            JOIN patients p ON p.user_id = u.id
            WHERE u.role = 'patient' AND u.status = 'approved'
              AND (u.full_name LIKE %s OR u.username LIKE %s)
            LIMIT 10
        """, (f"%{query_str}%", f"%{query_str}%"))
        results = db_cursor.fetchall()
        db_cursor.close()
        db_conn.close()
        return jsonify(results), 200
    except Exception as error_msg:
        return jsonify({"error": str(error_msg)}), 500



@app.route("/access/status", methods=["GET"])
@jwt_required()
def fetch_patient_permissions():
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        patient_profile = db_cursor.fetchone()
        if not patient_profile:
            return jsonify({"status": "success", "permissions": []})

        db_cursor.execute("""
            SELECT u.id as doctor_user_id, u.full_name as doctor_name, a.status, a.requested_at
            FROM access_permissions a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = %s AND a.status IN ('pending', 'approved')
        """, (patient_profile['id'],))
        perm_list = db_cursor.fetchall()
        for p in perm_list:
            if p['requested_at']: p['requested_at'] = p['requested_at'].isoformat()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "permissions": perm_list}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/access/respond", methods=["POST"])
@jwt_required()
def answer_access_request():
    active_session = json.loads(get_jwt_identity())
    payload = request.get_json() or {}
    target_doc_id = payload.get("doctor_user_id")
    chosen_action = payload.get("action") 

    if chosen_action not in ['approved', 'rejected']:
        return jsonify({"error": "Tindakan tidak diizinkan"}), 400

    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        p_prof = db_cursor.fetchone()
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (target_doc_id,))
        d_prof = db_cursor.fetchone()

        if not p_prof or not d_prof:
            return jsonify({"error": "Data entitas tidak valid"}), 404

        if chosen_action == 'approved':
            db_cursor.execute("UPDATE access_permissions SET status = 'approved', approved_at = NOW() WHERE patient_id = %s AND doctor_id = %s", (p_prof['id'], d_prof['id']))
            push_system_notification(target_doc_id, f"Pasien {active_session['full_name']} telah menerima permintaan akses rekam medis Anda.")
        else:
            db_cursor.execute("UPDATE access_permissions SET status = 'rejected', rejected_at = NOW() WHERE patient_id = %s AND doctor_id = %s", (p_prof['id'], d_prof['id']))
            push_system_notification(target_doc_id, f"Pasien {active_session['full_name']} menolak akses rekam medis.")

        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/access/patients", methods=["GET"])
@jwt_required()
def fetch_doctor_patient_list():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Terlarang"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        d_prof = db_cursor.fetchone()
        if not d_prof:
            return jsonify({"status": "success", "patients": []})

        db_cursor.execute("""
            SELECT u.id as patient_user_id, u.full_name as patient_name, a.status,
                   (SELECT diagnosis FROM medical_records m WHERE m.patient_id = p.id ORDER BY m.created_at DESC LIMIT 1) as active_diagnosis
            FROM access_permissions a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = %s AND a.status = 'approved'
        """, (d_prof['id'],))
        p_list = db_cursor.fetchall()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "patients": p_list}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/records/medical", methods=["POST"])
@jwt_required()
def create_clinical_record():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['patient']: 
        return jsonify({"error": "Hanya pasien yang dapat menambahkan rekam medis."}), 403
    
    payload = request.get_json() or {}
    
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        pat_prof = db_cursor.fetchone()
        
        db_cursor.execute(
            "INSERT INTO medical_records (patient_id, doctor_id, diagnosis, symptoms, treatment, notes) VALUES (%s, NULL, %s, %s, %s, %s)",
            (pat_prof['id'], payload.get("diagnosis"), payload.get("symptoms"), payload.get("treatment"), payload.get("notes"))
        )
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "message": "Rekam medis tersimpan"}), 201
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/records/medical/patient/<int:patient_user_id>", methods=["GET"])
@jwt_required()
def fetch_clinical_records(patient_user_id):
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (patient_user_id,))
        p_prof = db_cursor.fetchone()
        if not p_prof: 
            return jsonify({"error": "Identitas pasien tidak ditemukan"}), 404
        
        has_access = False
        if active_session['role'] == 'patient' and active_session['id'] == patient_user_id: 
            has_access = True
        elif active_session['role'] == 'admin': 
            has_access = True
        elif active_session['role'] == 'herbal_doctor':
            db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
            d_prof = db_cursor.fetchone()
            if d_prof:
                db_cursor.execute("SELECT status FROM access_permissions WHERE patient_id = %s AND doctor_id = %s", (p_prof['id'], d_prof['id']))
                auth_val = db_cursor.fetchone()
                if auth_val and auth_val['status'] == 'approved': 
                    has_access = True
                
        if not has_access: 
            return jsonify({"error": "Izin medis ditolak"}), 403
            
        query = """
            SELECT m.id, m.diagnosis, m.symptoms, m.treatment, m.notes, m.created_at, u.full_name as doctor_name 
            FROM medical_records m 
            LEFT JOIN doctors d ON m.doctor_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id
            WHERE m.patient_id = %s ORDER BY m.created_at DESC
        """
        db_cursor.execute(query, (p_prof['id'],))
        med_records = db_cursor.fetchall()
        for r in med_records: 
            r['created_at'] = r['created_at'].isoformat()
            
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "records": med_records}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/records/medical/doctor", methods=["GET"])
@jwt_required()
def fetch_doctor_clinical_records():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Terlarang"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        d_prof = db_cursor.fetchone()
        if not d_prof:
            return jsonify({"error": "Profil dokter tidak ditemukan"}), 404
            
        query = """
            SELECT m.id, m.diagnosis, m.symptoms, m.treatment, m.notes, m.created_at, u.full_name as patient_name, u.id as patient_user_id
            FROM medical_records m 
            JOIN patients p ON m.patient_id = p.id 
            JOIN users u ON p.user_id = u.id
            WHERE m.doctor_id = %s ORDER BY m.created_at DESC
        """
        db_cursor.execute(query, (d_prof['id'],))
        med_records = db_cursor.fetchall()
        for r in med_records: 
            r['created_at'] = r['created_at'].isoformat()
            
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "records": med_records}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/records/medical/<int:record_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_clinical_record(record_id):
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'patient':
        return jsonify({"error": "Hanya pasien yang dapat mengedit rekam medis."}), 403
        
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        p_prof = db_cursor.fetchone()
        
        db_cursor.execute("SELECT patient_id FROM medical_records WHERE id = %s", (record_id,))
        rec = db_cursor.fetchone()
        if not rec or rec['patient_id'] != p_prof['id']:
            return jsonify({"error": "Record tidak ditemukan atau akses ditolak"}), 404
            
        if request.method == "DELETE":
            db_cursor.execute("DELETE FROM medical_records WHERE id = %s", (record_id,))
            db_conn.commit()
            msg = "Record dihapus"
        elif request.method == "PUT":
            payload = request.get_json() or {}
            db_cursor.execute(
                "UPDATE medical_records SET diagnosis = %s, symptoms = %s, treatment = %s, notes = %s WHERE id = %s",
                (payload.get("diagnosis"), payload.get("symptoms"), payload.get("treatment"), payload.get("notes"), record_id)
            )
            db_conn.commit()
            msg = "Record diperbarui"
            
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "message": msg}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/doctor/dashboard/stats", methods=["GET"])
@jwt_required()
def doctor_stats():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Akses khusus dokter"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (active_session['id'],))
        d_prof = db_cursor.fetchone()
        
        if not d_prof:
            db_cursor.close(); db_conn.close()
            return jsonify({"stats": {"active": 0, "pending": 0, "rejected": 0, "totalInput": 0}}), 200

        doc_local_id = d_prof['id']

        db_cursor.execute("""
            SELECT SUM(status='approved') AS active, SUM(status='pending') AS pending, SUM(status='rejected') AS rejected
            FROM access_permissions WHERE doctor_id = %s
        """, (doc_local_id,))
        access_aggregates = db_cursor.fetchone()

        db_cursor.execute("SELECT COUNT(*) AS total FROM medical_records WHERE doctor_id = %s", (doc_local_id,))
        records_total = db_cursor.fetchone()['total']

        db_cursor.close()
        db_conn.close()
        return jsonify({
            "stats": {
                "active": int(access_aggregates['active'] or 0),
                "pending": int(access_aggregates['pending'] or 0),
                "rejected": int(access_aggregates['rejected'] or 0),
                "totalInput": int(records_total)
            }
        }), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/patient/dashboard/stats", methods=["GET"])
@jwt_required()
def patient_stats():
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id FROM patients WHERE user_id = %s", (active_session['id'],))
        p_prof = db_cursor.fetchone()
        if not p_prof: 
            return jsonify({"error": "Profil tidak ada"}), 404

        db_cursor.execute("SELECT recommendation_count FROM users WHERE id = %s", (active_session['id'],))
        usr_details = db_cursor.fetchone()
        db_cursor.execute("SELECT COUNT(*) as count FROM medical_records WHERE patient_id = %s", (p_prof['id'],))
        rm_count = db_cursor.fetchone()['count']
        db_cursor.execute("SELECT COUNT(*) as count FROM access_permissions WHERE patient_id = %s AND status = 'approved'", (p_prof['id'],))
        approved_docs = db_cursor.fetchone()['count']
        db_cursor.execute("SELECT COUNT(*) as count FROM access_permissions WHERE patient_id = %s AND status = 'pending'", (p_prof['id'],))
        pend_reqs = db_cursor.fetchone()['count']

        db_cursor.close()
        db_conn.close()
        return jsonify({
            "recommendations": usr_details['recommendation_count'],
            "medical_records": rm_count,
            "authorized_doctors": approved_docs,
            "pending_requests": pend_reqs
        }), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/notifications", methods=["GET"])
@jwt_required()
def fetch_system_notifications():
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT * FROM sh_notifications WHERE user_id = %s ORDER BY tanggal DESC LIMIT 30", (active_session['id'],))
        notifs_list = db_cursor.fetchall()
        for item in notifs_list:
            if item['tanggal']: 
                item['tanggal'] = item['tanggal'].isoformat()
                
        db_cursor.execute("UPDATE sh_notifications SET is_read = TRUE WHERE user_id = %s", (active_session['id'],))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "notifications": notifs_list}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/notifications/mark-read", methods=["POST", "OPTIONS"])
@jwt_required()
def mark_notifications_read():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        db_cursor.execute("UPDATE sh_notifications SET is_read = TRUE WHERE user_id = %s", (active_session['id'],))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "message": "Semua notifikasi ditandai dibaca"}), 200
    except Exception as error_msg:
        return jsonify({"error": str(error_msg)}), 500

@app.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def count_unread_notifications():
    active_session = json.loads(get_jwt_identity())
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        db_cursor.execute("SELECT COUNT(*) FROM sh_notifications WHERE user_id = %s AND is_read = FALSE", (active_session['id'],))
        unread_val = db_cursor.fetchone()[0]
        db_cursor.close()
        db_conn.close()
        return jsonify({"count": unread_val}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/users", methods=["GET"])
@jwt_required()
def fetch_registered_users():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Akses dilarang"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id, username, email, full_name AS name, role, verification_status, document_url FROM users WHERE role != 'admin'")
        all_users = db_cursor.fetchall()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "users": all_users}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/users/<int:user_id>", methods=["DELETE", "OPTIONS"])
@jwt_required()
def delete_user_by_admin(user_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Akses dilarang"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        db_cursor.execute("DELETE FROM users WHERE id = %s AND role != 'admin'", (user_id,))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/verify/approve", methods=["POST"])
@jwt_required()
def grant_doctor_access():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Akses dilarang"}), 403
    payload = request.get_json() or {}
    target_id = payload.get("user_id") or payload.get("id")
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        db_cursor.execute("UPDATE users SET verification_status = 'approved', rejection_reason = NULL WHERE id = %s", (target_id,))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        push_system_notification(target_id, "Selamat, dokumen Anda telah disetujui. Akun dokter Anda aktif.")
        return jsonify({"status": "success"})
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/verify/reject", methods=["POST"])
@jwt_required()
def deny_doctor_access():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Akses dilarang"}), 403
    payload = request.get_json() or {}
    target_id = payload.get("user_id") or payload.get("id")
    denial_msg = payload.get("reason", "Lampiran STR/SIP tidak valid atau kurang jelas.")
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor()
        db_cursor.execute("DELETE FROM users WHERE id = %s", (target_id,))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success"})
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/dashboard/stats", methods=["GET"])
@jwt_required()
def retrieve_admin_metrics():
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Bukan Admin"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id, username, full_name AS name, role, verification_status, document_url FROM users WHERE role != 'admin'")
        all_registered = db_cursor.fetchall()
        
        metric_data = {
            "total_pengguna": len(all_registered),
            "pending_verif": sum(1 for u in all_registered if u['verification_status'] == 'pending'),
            "pasien": sum(1 for u in all_registered if u['role'] == 'patient'),
            "dokter_medis": sum(1 for u in all_registered if u['role'] == 'doctor'),
            "dokter_herbal": sum(1 for u in all_registered if u['role'] == 'herbal_doctor')
        }
        awaiting_list = [u for u in all_registered if u['verification_status'] == 'pending']
        db_cursor.close()
        db_conn.close()
        return jsonify({"status": "success", "stats": metric_data, "pending_registrations": awaiting_list}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/admin/view-document/<int:user_id>", methods=["GET"])
@jwt_required()
def open_attachment(user_id):
    active_session = json.loads(get_jwt_identity())
    if active_session['role'] != 'admin': 
        return jsonify({"error": "Khusus Admin"}), 403
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT document_url FROM users WHERE id = %s", (user_id,))
        found_user = db_cursor.fetchone()
        db_cursor.close()
        db_conn.close()
        
        if not found_user or not found_user['document_url']: 
            return jsonify({"error": "Dokumen nihil"}), 404
            
        doc_path = found_user['document_url']
        if not os.path.exists(doc_path): 
            return jsonify({"error": "File hilang dari penyimpanan"}), 404
            
        return send_from_directory(os.path.dirname(doc_path), os.path.basename(doc_path))
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/auth/register", methods=["POST", "OPTIONS"])
def create_new_account():
    if request.method == "OPTIONS": 
        return jsonify({"status": "OK"}), 200
        
    payload = request.form if request.form else (request.get_json() or {})
    req_uname = payload.get("username")
    req_email = payload.get("email")
    req_pass = payload.get("password")
    req_name = payload.get("full_name") or payload.get("name", "")
    req_role = payload.get("role", "patient")

    if not req_uname or not req_pass:
        return jsonify({"error": "Kredensial dasar tidak lengkap"}), 400

    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT * FROM users WHERE username = %s OR (email = %s AND email IS NOT NULL)", (req_uname, req_email))
        if db_cursor.fetchone(): 
            return jsonify({"error": "Data pengguna (email/username) bentrok"}), 409

        secured_pw = generate_password_hash(req_pass)
        attachment = None
        
        if req_role in ["doctor", "herbal_doctor"]:
            file_obj = request.files.get("document")
            if file_obj:
                os.makedirs("uploads", exist_ok=True)
                path_dest = os.path.join("uploads", f"{req_uname}_{file_obj.filename}")
                file_obj.save(path_dest)
                attachment = path_dest
        
        init_status = 'pending' if req_role in ['doctor', 'herbal_doctor'] else 'approved'
        ref_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8)) if req_role == 'patient' else None

        db_cursor.execute(
            "INSERT INTO users (username, email, password_hash, full_name, role, document_url, verification_status, referral_code) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
            (req_uname, req_email, secured_pw, req_name, req_role, attachment, init_status, ref_id)
        )
        created_id = db_cursor.lastrowid

        if req_role == 'patient': 
            db_cursor.execute("INSERT INTO patients (user_id) VALUES (%s)", (created_id,))
        elif req_role in ['doctor', 'herbal_doctor']: 
            db_cursor.execute("INSERT INTO doctors (user_id) VALUES (%s)", (created_id,))

        db_conn.commit()
        db_cursor.close()
        db_conn.close()

        if req_role == 'patient': 
            push_system_notification(created_id, "Hai! Pendaftaran Anda disetujui. Silakan akses fitur AI Rekomendasi Herbal.")
            
        return jsonify({"status": "success", "message": "Berhasil daftar", "user_id": created_id}), 201
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/auth/login", methods=["POST", "OPTIONS"])
def authenticate_user():
    if request.method == "OPTIONS": 
        return jsonify({"status": "OK"}), 200
        
    payload = request.get_json() or {}
    usr = payload.get("username")
    pwd = payload.get("password")

    if not usr or not pwd: 
        return jsonify({"error": "Form kosong"}), 400

    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT * FROM users WHERE username = %s", (usr,))
        account = db_cursor.fetchone()
        
        if not account or not check_password_hash(account['password_hash'], pwd): 
            return jsonify({"error": "Data login tidak cocok"}), 401
            
        if account['verification_status'] == 'rejected': 
            return jsonify({"error": "Pendaftaran ditolak admin", "reason": account.get('rejection_reason')}), 403
            
        if account['verification_status'] == 'revoked': 
            return jsonify({"error": "Akses Anda dicabut"}), 403

        db_cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (account['id'],))
        db_conn.commit()
        db_cursor.close()
        db_conn.close()

        jwt_token = create_access_token(identity=json.dumps({
            "id": account['id'],
            "username": account['username'],
            "role": account['role'],
            "full_name": account['full_name'],
            "status": account['verification_status']
        }))
        
        return jsonify({
            "status": "success",
            "token": jwt_token,
            "user": { 
                "id": account['id'], 
                "username": account['username'], 
                "full_name": account['full_name'], 
                "role": account['role'], 
                "status": account['verification_status'],
                "email": account['email']
            }
        }), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

@app.route("/auth/me", methods=["GET"])
@jwt_required()
def verify_identity():
    active_session = json.loads(get_jwt_identity())
    uid = active_session['id']
    u_role = active_session['role']
    try:
        db_conn = acquire_mysql_connection()
        db_cursor = db_conn.cursor(dictionary=True)
        db_cursor.execute("SELECT id, username, email, full_name, role, verification_status, recommendation_count FROM users WHERE id = %s", (uid,))
        profile = db_cursor.fetchone()
        
        if not profile: 
            return jsonify({"error": "Tidak ditemukan"}), 404
            
        if u_role == 'patient':
            db_cursor.execute("SELECT gender, birth_date, address FROM patients WHERE user_id = %s", (uid,))
            p_data = db_cursor.fetchone()
            if p_data:
                profile.update(p_data)
                if profile['birth_date']: 
                    profile['birth_date'] = profile['birth_date'].isoformat()
        elif u_role in ['doctor', 'herbal_doctor']:
            db_cursor.execute("SELECT specialization, hospital_name FROM doctors WHERE user_id = %s", (uid,))
            d_data = db_cursor.fetchone()
            if d_data: 
                profile.update(d_data)
                
        db_cursor.close()
        db_conn.close()
        return jsonify({"user": profile}), 200
    except Exception as error_msg: 
        return jsonify({"error": str(error_msg)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)