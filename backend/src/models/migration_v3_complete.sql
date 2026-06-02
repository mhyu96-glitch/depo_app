-- ===================================================================
-- MIGRATION V3 - COMPLETE FEATURE UPDATE
-- Jalankan di Supabase SQL Editor
-- ===================================================================

-- 1. Update users table - tambah role 'branch_admin' untuk admin cabang
-- branch_admin: admin cabang yang tidak bisa lihat laba rugi
-- admin/superadmin: admin pusat yang bisa lihat semua

-- Check current roles
SELECT DISTINCT role FROM users;

-- Update user MAKIN, ANO, HAMDAN, SAID menjadi branch_admin
UPDATE users SET role = 'branch_admin' 
WHERE username IN ('MAKIN', 'ANO', 'HAMDAN', 'SAID');

-- Verify
SELECT username, role, branch_id FROM users ORDER BY role, username;

-- ===================================================================
-- 2. TRANSACTIONS TABLE - Tambah kode transaksi dan tipe delivery
-- ===================================================================

-- Tambah kolom baru di transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(50) UNIQUE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'pickup'; -- 'pickup' atau 'delivery'
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS courier_id INTEGER REFERENCES couriers(id);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_transactions_code ON transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_transactions_delivery ON transactions(delivery_type);

-- Verify
\d transactions;

-- ===================================================================
-- 3. ATTENDANCE TABLE - Upgrade dengan face recognition
-- ===================================================================

-- Tambah kolom untuk face recognition dan timestamp detail
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_data TEXT; -- Base64 encoded face image
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_info VARCHAR(255);

-- Drop kolom lama jika masih pakai 'check_in' TIME
-- ALTER TABLE attendance DROP COLUMN IF EXISTS check_in;

-- Index
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_courier ON attendance(courier_id);

-- Verify
\d attendance;

-- ===================================================================
-- 4. TRANSACTION APPROVALS - Untuk kasir butuh izin admin
-- ===================================================================

CREATE TABLE IF NOT EXISTS transaction_approvals (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL, -- 'edit' atau 'delete'
  requested_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approvals_transaction ON transaction_approvals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON transaction_approvals(status);

-- ===================================================================
-- 5. COURIER FACE DATA - Untuk verifikasi face recognition
-- ===================================================================

CREATE TABLE IF NOT EXISTS courier_faces (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER REFERENCES couriers(id) ON DELETE CASCADE,
  face_encoding TEXT NOT NULL, -- Face encoding vector (JSON array)
  face_image TEXT, -- Base64 thumbnail
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courier_faces_courier ON courier_faces(courier_id);

-- ===================================================================
-- 6. AUDIT LOG - Track semua perubahan data penting
-- ===================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check users dengan role baru
SELECT username, role, branch_id FROM users ORDER BY role;

-- Check struktur tabel transactions
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- Check struktur tabel attendance
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Check tabel baru
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('transaction_approvals', 'courier_faces', 'audit_logs');

-- ===================================================================
-- SEEDING DEFAULT DATA (OPTIONAL)
-- ===================================================================

-- Example transaction codes (akan digenerate otomatis di backend)
-- Format: PKP-YYYYMMDD-XXXX (pickup) atau DLV-YYYYMMDD-XXXX (delivery)

-- ===================================================================
-- NOTES:
-- ===================================================================
-- 1. Role hierarchy: superadmin > admin > branch_admin > kasir
-- 2. branch_admin = admin cabang (MAKIN, ANO, HAMDAN, SAID)
-- 3. Transaction code format:
--    - Pickup: PKP-20260602-0001
--    - Delivery: DLV-20260602-0001
-- 4. Face recognition data disimpan as TEXT (base64 atau JSON)
-- 5. Approvals diperlukan untuk edit/delete transaksi oleh kasir
-- ===================================================================

COMMIT;
