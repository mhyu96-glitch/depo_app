-- ============================================================
-- Depo Air Minum - Supabase Advanced Setup
-- (Security, Performance, and Automation)
-- ============================================================

-- ==========================================
-- 1. AUTOMATIC UPDATED_AT TIMESTAMP
-- ==========================================
-- Create the trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_couriers_updated_at ON couriers;
CREATE TRIGGER trg_couriers_updated_at BEFORE UPDATE ON couriers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cash_flows_updated_at ON cash_flows;
CREATE TRIGGER trg_cash_flows_updated_at BEFORE UPDATE ON cash_flows FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_debts_updated_at ON debts;
CREATE TRIGGER trg_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ==========================================
-- 2. HIGH PERFORMANCE INDEXES
-- ==========================================
-- Customers: Very fast lookup by Whatsapp (used heavily in Customer Portal)
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);

-- Transactions: Fast queries for dashboard and historical data
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_branch ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Transaction Items: Fast join
CREATE INDEX IF NOT EXISTS idx_txn_items_txn_id ON transaction_items(transaction_id);

-- Commissions & Debts
CREATE INDEX IF NOT EXISTS idx_commissions_courier ON commissions(courier_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id);


-- ==========================================
-- 3. DATA INTEGRITY (CHECK CONSTRAINTS)
-- ==========================================
-- Products
ALTER TABLE products ADD CONSTRAINT chk_product_price CHECK (price >= 0);

-- Transactions
ALTER TABLE transactions ADD CONSTRAINT chk_txn_total_gallons CHECK (total_gallons >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_txn_subtotal CHECK (subtotal >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_txn_total_amount CHECK (total_amount >= 0);

-- Transaction Items
ALTER TABLE transaction_items ADD CONSTRAINT chk_item_quantity CHECK (quantity > 0);
ALTER TABLE transaction_items ADD CONSTRAINT chk_item_price CHECK (unit_price >= 0);
ALTER TABLE transaction_items ADD CONSTRAINT chk_item_total CHECK (total_price >= 0);

-- Commissions
ALTER TABLE commissions ADD CONSTRAINT chk_comm_amount CHECK (amount >= 0);


-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Enable RLS on all sensitive tables to block anonymous public access from the internet.
-- Since the NodeJS backend connects as superuser (`postgres`), it will completely bypass RLS.
-- This ensures your database is 100% private to the outside world, but fully accessible to your backend.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Notice: No public policies are created. Any direct API call to Supabase REST endpoints 
-- from an unauthorized source will return 0 rows. Your backend is safe.
