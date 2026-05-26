-- ============================================================
-- HERBALSAFEAI - Schema Migration untuk Aiven Cloud MySQL
-- Database: defaultdb (Aiven tidak mengizinkan CREATE DATABASE)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =======================
-- TABEL: users
-- =======================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role ENUM('admin', 'patient', 'doctor', 'herbal_doctor') NOT NULL,
    document_url VARCHAR(255) NULL,
    verification_status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: patients
-- =======================
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gender ENUM('L', 'P', 'Other') NULL,
    birth_date DATE NULL,
    address TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: doctors
-- =======================
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization VARCHAR(100) NULL,
    hospital_name VARCHAR(200) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: access_permissions
-- =======================
CREATE TABLE IF NOT EXISTS access_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_access (patient_id, doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: medical_records
-- =======================
CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: sh_notifications
-- =======================
CREATE TABLE IF NOT EXISTS sh_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pesan TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: herbal_catalogs
-- =======================
CREATE TABLE IF NOT EXISTS herbal_catalogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    nama VARCHAR(255) NOT NULL,
    indikasi TEXT NOT NULL,
    kontraindikasi TEXT NOT NULL,
    deskripsi TEXT,
    chroma_doc_id VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =======================
-- TABEL: sh_riwayat_rekomendasi
-- =======================
CREATE TABLE IF NOT EXISTS sh_riwayat_rekomendasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    keluhan TEXT NOT NULL,
    hasil_ai JSON NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- SEED DATA: Akun Admin Default
-- Password: admin123 (pbkdf2:sha256 hash)
-- ============================================================
INSERT IGNORE INTO users (username, email, password_hash, full_name, role, verification_status)
VALUES (
    'admin', 
    'admin@smartherbal.id', 
    'pbkdf2:sha256:600000$QoJ8QkIFyQpPA2do$b3de13ee33b2047f3c65f39913888708ef738380d5b8ed96a47431c03d21cd39',
    'Administrator', 
    'admin', 
    'approved'
);
