-- ============================================================
-- Migration V2: Superadmin role + Fleet owner + Customer barcode
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom owner_name & owner_phone ke fleet_vehicles
ALTER TABLE fleet_vehicles 
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_service DATE,
  ADD COLUMN IF NOT EXISTS next_service DATE;

-- 2. Tambah unique_code (barcode-friendly, numeric) ke customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS barcode_code VARCHAR(20) UNIQUE;

-- Update barcode_code untuk pelanggan lama yang belum punya
UPDATE customers
SET barcode_code = LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0')
WHERE barcode_code IS NULL;

-- 3. Tambah kolom user_id ke couriers (untuk fitur rolling kurir ↔ kasir)
ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 4. Seed: Superadmin user (password = 'superadmin123')
INSERT INTO users (branch_id, name, username, password, role) 
VALUES (
  1, 
  'Super Administrator', 
  'superadmin', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 
  'superadmin'
) ON CONFLICT (username) DO NOTHING;
