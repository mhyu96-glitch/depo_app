-- ============================================================
-- Depo Air Minum - Supabase (PostgreSQL) Schema
-- ============================================================

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS cash_flows CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS couriers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- Branches
CREATE TABLE branches (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  code        VARCHAR(10) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Admin & Kasir)
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  username    VARCHAR(50) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'kasir' CHECK (role IN ('admin', 'kasir')),
  branch_id   INT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Strict Sessions
CREATE TABLE sessions (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  device_info VARCHAR(255),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  branch_id   INT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Customers
CREATE TABLE customers (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  whatsapp          VARCHAR(20),
  address           TEXT,
  house_number      VARCHAR(20),
  block_name        VARCHAR(100),
  voucher_code      VARCHAR(20) UNIQUE,
  branch_id         INT,
  loyalty_count     INT DEFAULT 0,
  total_free_gallon INT DEFAULT 0,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Couriers
CREATE TABLE couriers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  branch_id   INT,
  base_salary DECIMAL(10,2) DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE attendance (
  id          SERIAL PRIMARY KEY,
  courier_id  INT NOT NULL,
  branch_id   INT,
  date        DATE NOT NULL,
  check_in    TIME,
  notes       TEXT,
  created_by  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id)  REFERENCES branches(id)  ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT unique_attendance UNIQUE (courier_id, date)
);

-- Transactions (POS Header)
CREATE TABLE transactions (
  id               SERIAL PRIMARY KEY,
  invoice_number   VARCHAR(50) NOT NULL UNIQUE,
  customer_id      INT,
  customer_name    VARCHAR(100),
  branch_id        INT,
  transaction_type VARCHAR(20) NOT NULL DEFAULT 'pickup' CHECK (transaction_type IN ('pickup', 'delivery')),
  courier_id       INT,
  total_gallons    INT NOT NULL DEFAULT 0,
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  discount         DECIMAL(10,2) DEFAULT 0,
  total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method   VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'credit')),
  payment_status   VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  is_free_gallon   BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id)   REFERENCES branches(id)  ON DELETE SET NULL,
  FOREIGN KEY (courier_id)  REFERENCES couriers(id)  ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL
);

-- Transaction Items (POS Detail)
CREATE TABLE transaction_items (
  id             SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id     INT,
  product_name   VARCHAR(100),
  quantity       INT NOT NULL DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)     REFERENCES products(id)     ON DELETE SET NULL
);

-- Courier Commissions
CREATE TABLE commissions (
  id             SERIAL PRIMARY KEY,
  courier_id     INT NOT NULL,
  transaction_id INT NOT NULL,
  branch_id      INT,
  total_gallons  INT NOT NULL,
  rate_per_gallon DECIMAL(10,2) NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  date           DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courier_id)     REFERENCES couriers(id)     ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id)      REFERENCES branches(id)     ON DELETE SET NULL
);

-- Cash Flows
CREATE TABLE cash_flows (
  id          SERIAL PRIMARY KEY,
  branch_id   INT,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category    VARCHAR(100),
  description TEXT,
  amount      DECIMAL(10,2) NOT NULL,
  date        DATE NOT NULL,
  reference   VARCHAR(100),
  created_by  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)  REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- Debts
CREATE TABLE debts (
  id             SERIAL PRIMARY KEY,
  customer_id    INT NOT NULL,
  transaction_id INT,
  branch_id      INT,
  amount         DECIMAL(10,2) NOT NULL,
  paid_amount    DECIMAL(10,2) DEFAULT 0,
  due_date       DATE,
  status         VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)    REFERENCES customers(id)    ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id)      REFERENCES branches(id)     ON DELETE SET NULL
);

-- ============================================================
-- Default Seed Data
-- ============================================================
INSERT INTO branches (name, address, code, phone)
VALUES ('Cabang Utama', 'Jl. Raya No. 1', 'CB001', '081234567890') ON CONFLICT (code) DO NOTHING;

INSERT INTO users (name, username, password, role, branch_id)
VALUES ('Administrator', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWa', 'admin', 1) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (name, username, password, role, branch_id)
VALUES ('Kasir Utama', 'kasir', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir', 1) ON CONFLICT (username) DO NOTHING;

INSERT INTO products (name, price, branch_id)
VALUES ('Galon Air Minum', 5000.00, 1);
