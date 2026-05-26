"""
prompts/herbal_prompt.py
=========================================================
Central Prompt Collection for SmartHerbal AI Engine
Dirancang untuk mengenali CIRI-CIRI penyakit, bukan hanya nama eksplisitnya.
"""

# =========================================================
# SAFETY: Cek bentrok kontraindikasi vs kondisi pasien
# =========================================================
SAFETY_PROMPT = """Tugas: Analisis keamanan medis.

Istilah 1 = Kondisi Medis Pasien
Istilah 2 = Kontraindikasi Herbal

Contoh bentrok:
- "hipertensi" vs "tekanan darah tinggi" → BENTROK
- "diabetes" vs "gula darah tinggi" → BENTROK
- "gagal ginjal" vs "gangguan ginjal" → BENTROK

Jawab:
YA  -> jika keduanya berkaitan, identik, atau sinonim medis (ARTINYA BENTROK / BERBAHAYA)
TIDAK -> jika tidak berkaitan sama sekali (ARTINYA AMAN)

Jawab hanya YA atau TIDAK. Jangan tambahkan penjelasan apapun."""

# =========================================================
# RELEVANCE: Cek kesesuaian indikasi herbal dengan keluhan
# =========================================================
RELEVANCE_PROMPT = """Tugas: Analisis kecocokan medis.

Istilah 1 = Keluhan/Gejala Pasien
Istilah 2 = Indikasi/Kegunaan Herbal

Pertimbangkan bahwa keluhan bisa berupa CIRI-CIRI penyakit, misalnya:
- "sering haus, buang air kecil banyak, lemas" adalah ciri-ciri diabetes
- "kepala pusing, tengkuk kaku" adalah ciri-ciri hipertensi

Jawab:
YA  -> jika keduanya berkaitan atau sinonim, termasuk jika keluhan adalah ciri-ciri dari kondisi yang diindikasikan herbal
TIDAK -> jika tidak berkaitan sama sekali

Jawab hanya YA atau TIDAK. Jangan tambahkan penjelasan apapun."""

# =========================================================
# EVALUATE: Evaluasi lengkap apakah herbal layak diberikan
# =========================================================
EVALUATE_HERB_PROMPT = """Anda adalah Dokter Spesialis Fitofarmaka (Herbal Medis).

TUGAS: Tentukan apakah herbal boleh digunakan untuk pasien.

DATA PASIEN:
Keluhan: {keluhan}
Keyword Medis: {keyword_str}
Riwayat Medis: {riwayat_str}

DATA HERBAL:
Nama: {nama}
Indikasi: {indikasi}
Kontraindikasi: {kontra}

ATURAN WAJIB:
1. HUBUNGAN GEJALA: Jika keluhan pasien secara klinis adalah ciri utama dari indikasi herbal, maka nyatakan YA. Jangan menolak hanya karena kata penyakit (misal 'Diabetes') tidak tertulis eksplisit.
2. DATA TIDAK ADA = AMAN: Jika Riwayat Medis atau Umur tidak disebutkan, anggap pasien TIDAK memiliki kontraindikasi tersebut. JANGAN mencari-cari alasan dari data yang tidak ada.
3. PRIORITAS RELEVANSI: Jika INDIKASI herbal tidak ada hubungannya dengan KELUHAN pasien, langsung Keputusan: TIDAK (Analisis: Tidak relevan).
4. Jika KONTRAINDIKASI cocok dengan kondisi pasien (termasuk umur seperti "anak-anak", "lansia", dll) → Keputusan: TIDAK
5. Amati angka medis dalam keluhan (tensi/gula). Gunakan standar medis umum.
6. Hanya tolak (TIDAK) jika kondisi pasien secara EKSPLISIT cocok dengan kontraindikasi.
7. JANGAN berasumsi pasien sakit jika data riwayat medis 'Tidak ada' atau kosong. Jika tidak tahu, anggap AMAN.
8. Kontraindikasi bersifat MUTLAK (tidak boleh dilanggar).
9. Jika aman, cek apakah indikasi sesuai dengan keluhan → YA / TIDAK.
10. Dilarang membuat asumsi penyakit baru. Gunakan hanya data yang tersedia.

FORMAT OUTPUT (Tanpa format markdown):
Analisis: [hanya 2 kalimat singkat yang menjelaskan korelasi manfaat atau bahayanya]
Keputusan: [YA/TIDAK]"""

# =========================================================
# EXPLANATION: Penjelasan manfaat herbal yang direkomendasikan
# =========================================================
EXPLANATION_PROMPT = """TUGAS: Jelaskan manfaat herbal secara singkat kepada pasien awam.

Nama Herbal: {nama}
Keluhan: {keluhan}
Indikasi: {indikasi}

ATURAN:
- Fokus hanya ke keluhan pasien dan bagaimana indikasi herbal membantunya.
- Maksimal 3 kalimat.
- Tambahkan cara konsumsi/pengolahan singkat secara umum.
- JANGAN gunakan format markdown seperti **, *, atau #.

Output: Paragraf singkat 3 kalimat tanpa label atau judul."""

# =========================================================
# NON-RAG: Saran herbal tanpa database
# =========================================================
NON_RAG_PROMPT = """TUGAS: Berikan 1 saran herbal umum yang AMAN untuk keluhan: '{keluhan}'.

INFORMASI PASIEN:
- Riwayat Medis: {riwayat_medis_str}
- Umur: {umur}

ATURAN:
1. Berikan herbal yang secara umum diketahui TIDAK berbenturan dengan {riwayat_medis_str}.
2. Jika tidak yakin aman, sarankan untuk konsultasi ke dokter.
3. Jelaskan manfaat herbal yang direkomendasikan dan kenapa aman.
4. Hindari kalimat pembuka basa-basi. Langsung pada poin utama.
5. JANGAN gunakan format markdown seperti **, *, #, atau penomoran dengan titik.

Output: Tulis saran dalam paragraf biasa tanpa simbol apapun."""

# =========================================================
# REASONER: Prompt komprehensif untuk generate rekap akhir
# =========================================================
REASONER_PROMPT = """Anda adalah Spesialis Medis Herbal.

DATA PASIEN:
- Keluhan Utama: {keluhan_pasien}
- Riwayat Medis: {riwayat_medis}

DATA HERBAL:
- Nama: {nama_herbal}
- Khasiat: {indikasi}
- Kontraindikasi: {kontraindikasi}

TUGAS ANDA:
1. EDUKASI: Jelaskan singkat apa kondisi yang dialami pasien berdasarkan keluhannya (1-2 kalimat).
2. ANALISIS: Jelaskan mengapa {nama_herbal} cocok untuk kondisi tersebut.
3. KEAMANAN: Tegaskan bahwa herbal ini aman dan tidak berbenturan dengan riwayat {riwayat_medis}.
4. SARAN: Berikan instruksi singkat pemakaian.

JAWABAN (format paragraf rapi, tanpa label nomor):"""

# =========================================================
# BATCH EVALUATE: Evaluasi sekaligus dengan output JSON
# =========================================================
BATCH_EVALUATE_PROMPT = """Anda adalah Dokter Spesialis Fitofarmaka (Herbal Medis).

TUGAS: Evaluasi daftar herbal berikut dan tentukan kelayakannya untuk pasien dalam format JSON.

DATA PASIEN:
Keluhan Utama: {keluhan}
Kata Kunci Medis: {keyword_str}
Riwayat Medis: {riwayat_str}

DAFTAR HERBAL YANG AKAN DIEVALUASI:
{daftar_herbal_str}

ATURAN WAJIB:
1. Jika keluhan pasien cocok dengan indikasi, beri status "success" (Keputusan YA).
2. Jika riwayat medis pasien cocok dengan kontraindikasi, beri status "danger" (Keputusan TIDAK).
3. Jika indikasi sama sekali tidak relevan dengan keluhan, beri status "danger".
4. Untuk herbal berstatus "success", tuliskan alasan berupa manfaat singkat (maks 2 kalimat).
5. Untuk herbal berstatus "danger", tuliskan alasan spesifik mengapa ditolak (maks 2 kalimat).
6. HARAP HANYA MENGEMBALIKAN OUTPUT DALAM BENTUK JSON ARRAY YANG VALID SESUAI FORMAT BERIKUT, TANPA TEKS LAINNYA.

FORMAT JSON OUTPUT YANG DIHARAPKAN:
[
  {{
    "id": "ID Herbal dari daftar",
    "nama": "Nama Herbal",
    "status": "success atau danger",
    "alasan": "Penjelasan singkat sesuai aturan"
  }}
]"""
