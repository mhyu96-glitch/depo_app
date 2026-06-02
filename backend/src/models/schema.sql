-- ============================================================
-- Depo Air Minum - Database Schema
-- Run this file once to initialize the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS depo_air_minum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE depo_air_minum;

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  code        VARCHAR(10) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users (Admin & Kasir)
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  username    VARCHAR(50) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','kasir') NOT NULL DEFAULT 'kasir',
  branch_id   INT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Strict Sessions (1 user = 1 device at a time)
CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  device_info VARCHAR(255),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  branch_id   INT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
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
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Couriers
CREATE TABLE IF NOT EXISTS couriers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  branch_id   INT,
  base_salary DECIMAL(10,2) DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
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
  UNIQUE KEY unique_attendance (courier_id, date)
);

-- Transactions (POS Header)
CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number   VARCHAR(50) NOT NULL UNIQUE,
  customer_id      INT,
  customer_name    VARCHAR(100),
  branch_id        INT,
  transaction_type ENUM('pickup','delivery') NOT NULL DEFAULT 'pickup',
  courier_id       INT,
  total_gallons    INT NOT NULL DEFAULT 0,
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  discount         DECIMAL(10,2) DEFAULT 0,
  total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method   ENUM('cash','transfer','credit') DEFAULT 'cash',
  payment_status   ENUM('paid','unpaid','partial') DEFAULT 'paid',
  is_free_gallon   BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id)   REFERENCES branches(id)  ON DELETE SET NULL,
  FOREIGN KEY (courier_id)  REFERENCES couriers(id)  ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL
);

-- Transaction Items (POS Detail)
CREATE TABLE IF NOT EXISTS transaction_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS commissions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS cash_flows (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT,
  type        ENUM('income','expense') NOT NULL,
  category    VARCHAR(100),
  description TEXT,
  amount      DECIMAL(10,2) NOT NULL,
  date        DATE NOT NULL,
  reference   VARCHAR(100),
  created_by  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)  REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT NOT NULL,
  transaction_id INT,
  branch_id      INT,
  amount         DECIMAL(10,2) NOT NULL,
  paid_amount    DECIMAL(10,2) DEFAULT 0,
  due_date       DATE,
  status         ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)    REFERENCES customers(id)    ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id)      REFERENCES branches(id)     ON DELETE SET NULL
);

-- ============================================================
-- Default Seed Data
-- ============================================================
INSERT IGNORE INTO branches (name, address, code, phone)
VALUES ('Cabang Utama', 'Jl. Raya No. 1', 'CB001', '081234567890');

-- Default admin: password = admin123
INSERT IGNORE INTO users (name, username, password, role, branch_id)
VALUES ('Administrator', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWa', 'admin', 1);

-- Default kasir: password = kasir123
INSERT IGNORE INTO users (name, username, password, role, branch_id)
VALUES ('Kasir Utama', 'kasir', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir', 1);

INSERT IGNORE INTO products (name, price, branch_id)
VALUES ('Galon Air Minum', 5000.00, 1);
