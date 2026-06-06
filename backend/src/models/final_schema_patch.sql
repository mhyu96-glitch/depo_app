-- ============================================================
-- FINAL SCHEMA PATCH - Depo Air Minum App
-- Run in Supabase SQL Editor after the base schema.
-- Safe to run multiple times.
-- ============================================================

-- USERS / COURIERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15,2) DEFAULT 0;

-- CUSTOMERS
ALTER TABLE customers ADD COLUMN IF NOT EXISTS barcode_code VARCHAR(20) UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS house_number VARCHAR(10);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS block_name VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_free_gallon INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'Silver';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMP;
UPDATE customers
SET barcode_code = LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0')
WHERE barcode_code IS NULL;

-- PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;

-- TRANSACTIONS
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_gallons INTEGER DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS partial_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_discount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_type VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMP;

-- ATTENDANCE
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_data TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_info VARCHAR(255);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- INVENTORY
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'supply';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 10;
UPDATE inventory SET current = current_stock WHERE current = 0 AND current_stock > 0;
UPDATE inventory SET capacity = GREATEST(capacity, current, min_stock) WHERE capacity IS NULL OR capacity = 0;

-- FLEET
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100);
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20);

-- SHIFT MANAGEMENT
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  opening_cash DECIMAL(15,2) DEFAULT 0,
  closing_cash DECIMAL(15,2),
  expected_cash DECIMAL(15,2),
  difference DECIMAL(15,2),
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  notes TEXT,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS total_sales DECIMAL(15,2) DEFAULT 0;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0;

-- PROCUREMENT
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  category VARCHAR(50),
  payment_terms_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  items_description TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- APPROVALS / FACE DATA
CREATE TABLE IF NOT EXISTS transaction_approvals (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL,
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courier_faces (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER REFERENCES couriers(id) ON DELETE CASCADE,
  face_encoding TEXT,
  face_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value, description, updated_at)
VALUES
  ('courier_commission_base_rate', '500', 'Komisi kurir per galon untuk jumlah normal', CURRENT_TIMESTAMP),
  ('courier_commission_threshold_gallons', '60', 'Batas galon untuk memakai komisi tier tinggi', CURRENT_TIMESTAMP),
  ('courier_commission_threshold_rate', '1000', 'Komisi kurir per galon setelah melewati batas tier', CURRENT_TIMESTAMP),
  ('courier_commission_tiers', '[{"min_gallons":1,"max_gallons":60,"rate":500},{"min_gallons":61,"max_gallons":null,"rate":1000}]', 'Daftar tier/rate komisi kurir per galon', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch_created ON transactions(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_courier_delivery ON transactions(courier_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_transactions_delete_requested ON transactions(delete_requested) WHERE delete_requested = TRUE;
CREATE INDEX IF NOT EXISTS idx_inventory_branch_name ON inventory(branch_id, name);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_date ON attendance(branch_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_courier_date ON attendance(courier_id, date);
