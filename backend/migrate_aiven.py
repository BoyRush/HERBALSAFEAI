"""
Script untuk menjalankan migrasi database ke Aiven Cloud MySQL.
Jalankan dari folder: c:\HERBALSAFEAI\backend\
Perintah: python migrate_aiven.py
"""
import os
import sys
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("   HERBALSAFEai - Migrasi Database ke Aiven Cloud MySQL")
print("=" * 60)

# ──────────────────────────────────────────────
# 1. Baca konfigurasi dari .env
# ──────────────────────────────────────────────
DB_HOST = os.environ.get("DB_HOST")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME", "defaultdb")
DB_PORT = int(os.environ.get("DB_PORT", 16335))
DB_SSL_CA = os.environ.get("DB_SSL_CA")

if not all([DB_HOST, DB_USER, DB_PASSWORD]):
    print("\n[ERROR] Konfigurasi .env tidak lengkap!")
    print("  Pastikan DB_HOST, DB_USER, DB_PASSWORD sudah diisi di .env")
    sys.exit(1)

print(f"\n[INFO] Target Database:")
print(f"  Host     : {DB_HOST}")
print(f"  Port     : {DB_PORT}")
print(f"  User     : {DB_USER}")
print(f"  Database : {DB_NAME}")
print(f"  SSL CA   : {DB_SSL_CA or 'Tidak digunakan'}")

# ──────────────────────────────────────────────
# 2. Buat koneksi ke Aiven
# ──────────────────────────────────────────────
print("\n[INFO] Menghubungkan ke Aiven MySQL...")

try:
    config = {
        "host": DB_HOST,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "database": DB_NAME,
        "port": DB_PORT,
        "collation": "utf8mb4_general_ci",
    }
    
    if DB_SSL_CA and os.path.exists(DB_SSL_CA):
        config["ssl_ca"] = DB_SSL_CA
        config["ssl_verify_cert"] = True
        print("[INFO] SSL Certificate ditemukan dan diaktifkan.")
    elif DB_SSL_CA:
        print(f"[WARNING] File SSL '{DB_SSL_CA}' tidak ditemukan. Coba koneksi tanpa SSL...")
    
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    print("[OK] Koneksi berhasil!")

except mysql.connector.Error as e:
    print(f"\n[ERROR] Gagal konek ke Aiven: {e}")
    print("\nPastikan:")
    print("  1. File ca.pem sudah diunduh dan ada di folder backend/")
    print("  2. Kredensial di .env sudah benar")
    print("  3. Koneksi internet Anda aktif")
    sys.exit(1)

# ──────────────────────────────────────────────
# 3. Baca file SQL
# ──────────────────────────────────────────────
migration_file = os.path.join(os.path.dirname(__file__), "migrations", "01_core_web2_schema.sql")

if not os.path.exists(migration_file):
    print(f"\n[ERROR] File migrasi tidak ditemukan: {migration_file}")
    sys.exit(1)

with open(migration_file, "r", encoding="utf-8") as f:
    sql_content = f.read()

# ──────────────────────────────────────────────
# 4. Pisahkan & Jalankan setiap statement SQL
# ──────────────────────────────────────────────
print(f"\n[INFO] Menjalankan file: migrations/01_core_web2_schema.sql")
print("-" * 60)

# Pisahkan per statement (berdasarkan titik koma)
statements = [s.strip() for s in sql_content.split(";") if s.strip()]

success_count = 0
skip_count = 0

for i, stmt in enumerate(statements):
    # Lewati komentar saja atau SET statements kosong
    if not stmt or stmt.startswith("--"):
        skip_count += 1
        continue
    
    try:
        cursor.execute(stmt)
        conn.commit()
        
        # Tampilkan info per statement
        first_word = stmt.split()[0].upper() if stmt.split() else ""
        if "CREATE TABLE" in stmt.upper():
            table_name = stmt.upper().split("CREATE TABLE IF NOT EXISTS")[1].split("(")[0].strip()
            print(f"  [OK] CREATE TABLE {table_name}")
        elif first_word == "INSERT":
            print(f"  [OK] INSERT seed data berhasil")
        elif first_word == "SET":
            print(f"  [OK] SET statement dijalankan")
        else:
            print(f"  [OK] Statement #{i+1} berhasil")
        
        success_count += 1

    except mysql.connector.Error as e:
        if e.errno == 1050:  # Table already exists
            table_info = stmt.split("EXISTS")[1].split("(")[0].strip() if "EXISTS" in stmt else "?"
            print(f"  [SKIP] Tabel {table_info} sudah ada (tidak diubah)")
            skip_count += 1
        elif e.errno == 1062:  # Duplicate entry (INSERT IGNORE gagal bypass)
            print(f"  [SKIP] Data sudah ada (INSERT IGNORE)")
            skip_count += 1
        else:
            print(f"  [ERROR] Statement #{i+1}: {e}")
            print(f"  SQL: {stmt[:80]}...")
            conn.rollback()

# ──────────────────────────────────────────────
# 5. Verifikasi tabel yang terbentuk
# ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("[INFO] Verifikasi Tabel di Aiven Database:")
print("-" * 60)

cursor.execute("SHOW TABLES;")
tables = cursor.fetchall()

expected_tables = [
    "users", "patients", "doctors",
    "access_permissions", "medical_records",
    "sh_notifications", "herbal_catalogs",
    "sh_riwayat_rekomendasi"
]

found_tables = [t[0] for t in tables]

for table in expected_tables:
    if table in found_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        print(f"  [✓] {table:<30} ({count} baris)")
    else:
        print(f"  [✗] {table:<30} TIDAK DITEMUKAN!")

# ──────────────────────────────────────────────
# 6. Selesai
# ──────────────────────────────────────────────
cursor.close()
conn.close()

print("\n" + "=" * 60)
print(f"  Selesai! {success_count} statement berhasil, {skip_count} dilewati.")
print("=" * 60)
print("\n[NEXT] Database Aiven siap digunakan.")
print("[NEXT] Sekarang lanjutkan ke Tahap 3: Deploy Backend ke Railway/VPS.")
