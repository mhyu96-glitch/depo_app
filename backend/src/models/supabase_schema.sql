-- ============================================================
-- Depo Command Center Pro - Full Database Schema
-- PostgreSQL / Supabase Compatible
-- ============================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'kasir',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20),
    address TEXT,
    house_number VARCHAR(10),
    block_name VARCHAR(50),
    voucher_code VARCHAR(20) UNIQUE,
    loyalty_count INTEGER DEFAULT 0,
    total_free_gallon INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'Silver',
    last_purchase_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couriers (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    base_salary DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    courier_id INTEGER REFERENCES couriers(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(20) DEFAULT 'pickup',
    delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, on_way, delivered, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- normal, express
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    subtotal DECIMAL(15,2) NOT NULL,
    discount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'paid',
    partial_amount DECIMAL(15,2) DEFAULT 0,
    commission_amount DECIMAL(15,2) DEFAULT 0,
    is_free_gallon BOOLEAN DEFAULT FALSE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL
);

-- ============================================================
-- OPERATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    courier_id INTEGER REFERENCES couriers(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out TIMESTAMP,
    delivery_count INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(courier_id, date)
);

CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    branch_name VARCHAR(100),
    note TEXT,
    status VARCHAR(20) DEFAULT 'paid',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FLEET & ASSETS
-- ============================================================

CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fleet_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    cost DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_health (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    branch_name VARCHAR(100),
    current_gallons INTEGER DEFAULT 0,
    lifespan_gallons INTEGER NOT NULL,
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    iot_device_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ENTERPRISE AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    target VARCHAR(200),
    detail TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- IOT SENSOR DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS iot_sensor_readings (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    sensor_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- WHATSAPP NOTIFICATIONS LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DEBT PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS debt_payments (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_branch ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iot_readings_device ON iot_sensor_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status, created_at DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO branches (name, code, address, phone, whatsapp) 
VALUES ('Depo Pusat', 'PST', 'Jl. Utama No. 1', '08123456789', '08123456789') 
ON CONFLICT DO NOTHING;

INSERT INTO branches (name, code, address, phone, whatsapp) 
VALUES ('Cabang Melati', 'MLT', 'Jl. Melati No. 5', '08198765432', '08198765432') 
ON CONFLICT DO NOTHING;

-- Admin: password = 'admin123'
INSERT INTO users (branch_id, name, username, password, role) 
VALUES (1, 'Super Admin', 'admin', '$2a$10$r/WGIyNpbMMqhS6Hyjde7O8pT1/EHF/EmNP2hdYAhuElJePIPpOqy', 'admin') 
ON CONFLICT (username) DO NOTHING;

-- Kasir: password = 'kasir123'
INSERT INTO users (branch_id, name, username, password, role) 
VALUES (1, 'Kasir Demo', 'kasir', '$2a$10$X4QSlMCUB1I/UTLrZEmF0eMe3KUelFixeYbSi5sDMekOqAXY9Omqy', 'kasir') 
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (branch_id, name, price) VALUES (1, 'Galon Isi Ulang', 5000) ON CONFLICT DO NOTHING;
INSERT INTO products (branch_id, name, price) VALUES (1, 'Galon Baru + Isi', 50000) ON CONFLICT DO NOTHING;
INSERT INTO products (branch_id, name, price) VALUES (1, 'Tutup Galon', 2000) ON CONFLICT DO NOTHING;
