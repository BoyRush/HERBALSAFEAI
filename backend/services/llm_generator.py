import json
import re
import traceback
import time
from services.groq_model import call_groq
from prompts.herbal_prompt import (
    SAFETY_PROMPT, RELEVANCE_PROMPT,
    EVALUATE_HERB_PROMPT, EXPLANATION_PROMPT, NON_RAG_PROMPT,
    BATCH_EVALUATE_PROMPT
)

def _clean_ai_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

SINONIM_MEDIS = {
    "hipertensi": ["hipertensi", "tekanan darah tinggi", "darah tinggi", "hypertension", "htn"],
    "diabetes": ["diabetes", "kencing manis", "gula darah tinggi", "dm", "diabetes mellitus", "hiperglikemia"],
    "gagal ginjal": ["gagal ginjal", "ginjal", "renal failure", "ckd", "penyakit ginjal"],
    "hepatitis": ["hepatitis", "liver", "hati", "hati meradang"],
    "ibu hamil": ["hamil", "kehamilan", "pregnant", "ibu hamil", "gestasi"],
    "anak-anak": ["anak", "bayi", "balita", "anak-anak", "pediatric"],
    "pendarahan": ["pendarahan", "bleeding", "antikoagulan", "pengencer darah"],
    "alergi": ["alergi", "hipersensitif", "reaksi alergi"],
    "maag": ["maag", "gastritis", "asam lambung", "gerd", "ulkus lambung"],
    "asma": ["asma", "asthma", "sesak napas", "bronkospasme"],
    "hipotensi": ["hipotensi", "tekanan darah rendah", "darah rendah", "hypotension"],
}

def _sinonim_match(term1: str, term2: str) -> bool:
    t1 = term1.lower().strip()
    t2 = term2.lower().strip()
    if t1 == t2:
        return True
    if t1 in t2 or t2 in t1:
        return True
    for key, variants in SINONIM_MEDIS.items():
        in_t1 = any(v in t1 for v in variants)
        in_t2 = any(v in t2 for v in variants)
        if in_t1 and in_t2:
            return True
    return False

def is_medical_clash(kondisi_pasien: str, kontraindikasi: str) -> bool:
    if not kontraindikasi or str(kondisi_pasien).lower().strip() in ["tidak ada", "-", "none", ""]:
        return False
    k1 = kondisi_pasien.lower().strip()
    k2 = kontraindikasi.lower().strip()
    if _sinonim_match(k1, k2):
        print(f"  [CLASH-MATCH] '{kondisi_pasien}' bentrok dengan '{kontraindikasi}'")
        return True
    try:
        prompt = f"Istilah 1: {kondisi_pasien}\nIstilah 2: {kontraindikasi}"
        jawaban = call_groq(prompt, system_prompt=SAFETY_PROMPT)
        if jawaban:
            jawaban = jawaban.upper().strip()
            if "YA" in jawaban and "TIDAK" not in jawaban:
                print(f"  [CLASH-AI] '{kondisi_pasien}' bentrok dengan '{kontraindikasi}'")
                return True
    except Exception as e:
        print(f"  [CLASH] AI gagal, pakai string match result: {e}")
    return False

def is_medical_relevant(keluhan: str, indikasi: str) -> bool:
    if not indikasi or str(indikasi).lower().strip() in ["tidak ada", "-", "none", ""]:
        return False
    k1 = keluhan.lower().strip()
    k2 = indikasi.lower().strip()
    if _sinonim_match(k1, k2):
        return True
    try:
        prompt = f"Istilah 1: {keluhan}\nIstilah 2: {indikasi}"
        jawaban = call_groq(prompt, system_prompt=RELEVANCE_PROMPT)
        if jawaban:
            jawaban = jawaban.upper().strip()
            return "YA" in jawaban and "TIDAK" not in jawaban
    except Exception:
        return False

def extract_medical_keywords(keluhan: str) -> list:
    prompt = f"""Ekstrak 4-6 kata kunci medis paling penting dari keluhan berikut.
Perhatikan bahwa keluhan bisa berupa ciri-ciri penyakit (bukan nama penyakitnya langsung).
Contoh: "sering haus, buang air kecil banyak, lemas" → keywords: diabetes, gula darah, hiperglikemia, polidipsia

Keluhan: {keluhan}

Jawab hanya daftar kata kunci, dipisah koma. Tanpa penjelasan."""
    try:
        result = call_groq(prompt, system_prompt="You are a medical keyword extractor. Identify the underlying medical condition from symptoms.")
        if not result:
            return []
        text = result.strip()
        text = re.sub(r"[^a-zA-Z0-9, \-]", "", text.lower())
        keywords = [k.strip() for k in text.split(",") if k.strip() and len(k.strip()) > 2]
        if len(keywords) == 1 and keywords[0].lower() == "tidak":
            keywords = []
        print(f"[KEYWORDS] {keywords}")
        return keywords[:6]
    except Exception as e:
        print(f"[KEYWORDS] Gagal ekstrak keyword: {e}")
        return []

def evaluate_herb(patient_context: dict, herb: dict, keywords: list = None) -> tuple:
    nama = herb.get("nama") or herb.get("name") or "Herbal"
    indikasi = str(herb.get("indikasi", "")).lower()
    kontra = str(herb.get("kontraindikasi", "")).lower()
    keluhan = patient_context.get("keluhan", "")
    riwayat = patient_context.get("kondisi_medis", [])
    riwayat_str = ", ".join(riwayat) if riwayat else "Tidak ada"
    keyword_str = ", ".join(keywords) if keywords else "Tidak ada"

    for kondisi in riwayat:
        if _sinonim_match(kondisi, kontra):
            alasan = f"Herbal ini dikontraindikasikan untuk pasien dengan kondisi {kondisi}."
            print(f"  [FALLBACK] {nama} DITOLAK karena kontraindikasi '{kondisi}' match dengan '{kontra}'")
            return "TIDAK", alasan

    prompt = EVALUATE_HERB_PROMPT.format(
        keluhan=keluhan,
        keyword_str=keyword_str,
        riwayat_str=riwayat_str,
        nama=nama,
        indikasi=indikasi,
        kontra=kontra
    )

    try:
        response = call_groq(prompt, system_prompt="Medical Decision Engine")
        if not response:
            raise ValueError("No response from Groq")
        response = _clean_ai_text(response.strip())

        keputusan = "TIDAK"
        analisis = "Tidak sesuai dengan kondisi medis atau keluhan pasien."

        for line in response.split("\n"):
            line = line.strip()
            if "Keputusan:" in line:
                val = line.split("Keputusan:")[-1].strip().upper()
                keputusan = "YA" if "YA" in val else "TIDAK"
            if "Analisis:" in line:
                analisis = line.split("Analisis:")[-1].strip()

        print(f"  [AI] {nama}: {keputusan} — {analisis[:60]}...")
        return keputusan, analisis

    except Exception as e:
        print(f"  [EVAL] AI gagal untuk {nama}: {e}")
        for kw in (keywords or []):
            if _sinonim_match(kw, indikasi):
                return "YA", f"{nama} relevan berdasarkan kecocokan kata kunci dengan indikasi."
        return "TIDAK", "Tidak dapat mengevaluasi relevansi herbal saat ini."

def generate_explanation(nama: str, keluhan: str, indikasi: str) -> str:
    prompt = EXPLANATION_PROMPT.format(nama=nama, keluhan=keluhan, indikasi=indikasi)
    try:
        response = call_groq(prompt, system_prompt="Herbal Expert")
        if response:
            return _clean_ai_text(response)
    except Exception:
        pass
    return f"{nama} memiliki indikasi untuk {indikasi} yang relevan dengan keluhan Anda. Konsultasikan dengan dokter untuk dosis yang tepat."

def _jalankan_non_rag(keluhan: str, riwayat_medis: list, patient_context: dict) -> dict:
    riwayat_medis_str = ", ".join(riwayat_medis) if riwayat_medis else "Tidak ada riwayat medis"
    umur = patient_context.get("umur", "tidak diketahui")
    prompt = NON_RAG_PROMPT.format(
        keluhan=keluhan,
        riwayat_medis_str=riwayat_medis_str,
        umur=umur
    )
    try:
        response = call_groq(prompt, system_prompt="AI Kesehatan Umum")
        alasan_umum = _clean_ai_text(response) if response else f"Untuk keluhan '{keluhan}', disarankan konsultasi dengan dokter."
    except Exception:
        alasan_umum = f"Untuk keluhan '{keluhan}', disarankan konsultasi dengan dokter atau apoteker."

    return {
        "status": "warning",
        "rekomendasi": [{
            "nama": "Saran AI (Pengetahuan Umum)",
            "alasan": alasan_umum,
            "status": "warning"
        }]
    }

def extract_json_block(text: str):
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # Try extracting markdown json code block
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass

    # Try extracting everything from first '[' to last ']'
    match_arr = re.search(r'(\[.*\])', text, re.DOTALL)
    if match_arr:
        try:
            return json.loads(match_arr.group(1).strip())
        except Exception:
            pass

    # Try extracting everything from first '{' to last '}'
    match_obj = re.search(r'(\{.*\})', text, re.DOTALL)
    if match_obj:
        try:
            res = json.loads(match_obj.group(1).strip())
            if isinstance(res, dict) and "rekomendasi" in res:
                return res["rekomendasi"]
            return res
        except Exception:
            pass

    return None

def generate_herbal_recommendation(keluhan, riwayat_medis_dicts, use_rag=True):
    from services.herbal_retriever import retrieve_relevant_herbs

    try:
        riwayat_medis = []
        if isinstance(riwayat_medis_dicts, list):
            for rm in riwayat_medis_dicts:
                if isinstance(rm, dict) and rm.get("diagnosis"):
                    riwayat_medis.append(rm.get("diagnosis"))
        elif isinstance(riwayat_medis_dicts, str):
            riwayat_medis = [riwayat_medis_dicts]

        patient_context = {
            "keluhan": keluhan,
            "kondisi_medis": riwayat_medis
        }

        if not use_rag:
            print("[MODE NON-RAG] AI Berpikir Tanpa Database...")
            return _jalankan_non_rag(keluhan, riwayat_medis, patient_context)

        print("[MODE RAG] Memulai Proses Database Pakar...")

        keywords = extract_medical_keywords(keluhan)
        keywords_query = ", ".join(keywords) if keywords else keluhan
        safe_herbs = retrieve_relevant_herbs(keywords_query)

        if not safe_herbs:
            safe_herbs = retrieve_relevant_herbs(keluhan)

        if not safe_herbs:
            print("[RAG ERROR] Tidak ada kandidat herbal dari database.")
            return {
                "status": "warning",
                "rekomendasi": [{
                    "nama": "Data Tidak Ditemukan",
                    "status": "warning",
                    "alasan": f"Tidak ada data herbal yang relevan dengan keluhan '{keluhan}'."
                }]
            }

        print(f"[RAG] Menemukan {len(safe_herbs)} herbal kandidat. Memulai evaluasi lokal...")

        # Semua kata dari keluhan dan keywords untuk pencocokan lokal
        all_terms = [kw.lower().strip() for kw in keywords if len(kw.strip()) >= 3]
        keluhan_words = [w.lower() for w in keluhan.split() if len(w) >= 4]
        all_terms.extend(keluhan_words)
        # Hapus duplikat
        all_terms = list(set(all_terms))

        final_rekomendasi = []
        herbs_approved = []  # Lolos lokal, perlu penjelasan LLM

        for herb in safe_herbs:
            nama = herb.get("nama") or herb.get("name") or "Herbal"
            indikasi = str(herb.get("indikasi") or "").lower()
            kontra = str(herb.get("kontraindikasi") or "").lower()
            print(f"\n--- Evaluasi Lokal: {nama} ---")
            print(f"  Indikasi: {indikasi}")
            print(f"  Kontraindikasi: {kontra}")

            # === STEP 1: CEK KONTRAINDIKASI LOKAL (PRIORITAS TINGGI) ===
            is_contraindicated = False
            contra_reason = ""
            for kondisi in riwayat_medis:
                if _sinonim_match(kondisi, kontra):
                    is_contraindicated = True
                    contra_reason = f"Herbal ini berkontraindikasi dengan kondisi medis Anda: {kondisi}. Tidak dianjurkan untuk dikonsumsi."
                    print(f"  [BAHAYA] Kontraindikasi cocok: '{kondisi}' vs '{kontra}'")
                    break

            if is_contraindicated:
                final_rekomendasi.append({
                    "id": herb.get("id"),
                    "nama": nama,
                    "status": "danger",
                    "alasan": contra_reason
                })
                continue

            # === STEP 2: CEK RELEVANSI INDIKASI LOKAL ===
            is_relevant = False
            matched_term = ""
            # Cek langsung apakah kata kunci ada di indikasi
            for term in all_terms:
                if term in indikasi or _sinonim_match(term, indikasi):
                    is_relevant = True
                    matched_term = term
                    print(f"  [COCOK LOKAL] '{term}' ditemukan dalam indikasi!")
                    break

            if is_relevant:
                # Herbal relevan secara lokal → simpan untuk penjelasan LLM
                herbs_approved.append(herb)
            else:
                # Tidak relevan secara lokal → coba evaluasi via LLM sebagai fallback
                print(f"  [TIDAK COCOK LOKAL] Mengevaluasi via LLM...")
                keputusan, analisis = evaluate_herb(patient_context, herb, keywords)
                if keputusan == "YA":
                    herbs_approved.append(herb)
                else:
                    final_rekomendasi.append({
                        "id": herb.get("id"),
                        "nama": nama,
                        "status": "danger",
                        "alasan": analisis or f"Indikasi {nama} tidak sesuai dengan keluhan Anda."
                    })
            time.sleep(0.3)

        # === STEP 3: GENERATE PENJELASAN UNTUK HERBAL YANG DISETUJUI ===
        for herb in herbs_approved:
            nama = herb.get("nama") or herb.get("name") or "Herbal"
            penjelasan = generate_explanation(nama, keluhan, herb.get("indikasi", ""))
            final_rekomendasi.append({
                "id": herb.get("id"),
                "nama": nama,
                "status": "success",
                "alasan": penjelasan
            })
            time.sleep(0.3)

        return {"status": "success", "rekomendasi": final_rekomendasi}

    except Exception as e:
        print(f"[ERROR LLM_GENERATOR]: {str(e)}")
        print(traceback.format_exc())
        return {"error": str(e)}
