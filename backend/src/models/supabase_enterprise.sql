-- ============================================================
-- Depo Air Minum - Supabase Enterprise Edition Setup
-- (Audit Logs, Realtime, and Analytics Views)
-- ============================================================

-- ==========================================
-- 1. FRAUD PREVENTION (AUDIT LOGS)
-- ==========================================
-- Create the audit_logs table to record sensitive changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Protect the audit_logs table from being modified or deleted
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Trigger Function to log transaction changes
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, current_setting('request.jwt.claim.sub', true));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only log if actual data changed (ignore simple updated_at changes if nothing else changed)
        IF row_to_json(OLD)::jsonb != row_to_json(NEW)::jsonb THEN
            INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
            VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, current_setting('request.jwt.claim.sub', true));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit Trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
AFTER UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

DROP TRIGGER IF EXISTS audit_cash_flows_trigger ON cash_flows;
CREATE TRIGGER audit_cash_flows_trigger
AFTER UPDATE OR DELETE ON cash_flows
FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();


-- ==========================================
-- 2. REALTIME NOTIFICATIONS
-- ==========================================
-- Enable Supabase Realtime for live dashboard updates
BEGIN;
  -- Add them safely
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
  ALTER PUBLICATION supabase_realtime ADD TABLE cash_flows;
COMMIT;

-- Make sure REPLICA IDENTITY is set to FULL so old data is sent on UPDATE/DELETE
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE attendance REPLICA IDENTITY FULL;


-- ==========================================
-- 3. ENTERPRISE ANALYTICS VIEWS
-- ==========================================
-- View 1: Daily Sales & Revenue (Loads instantly on Dashboard)
CREATE OR REPLACE VIEW view_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    branch_id,
    COUNT(id) as total_transactions,
    SUM(total_gallons) as total_gallons_sold,
    SUM(CASE WHEN transaction_type = 'delivery' THEN 1 ELSE 0 END) as delivery_count,
    SUM(CASE WHEN transaction_type = 'pickup' THEN 1 ELSE 0 END) as pickup_count,
    SUM(total_amount) as total_revenue,
    SUM(discount) as total_discounts
FROM transactions
WHERE payment_status = 'paid'
GROUP BY DATE(created_at), branch_id
ORDER BY sale_date DESC;

-- View 2: Unpaid Debts Tracker (Piutang)
CREATE OR REPLACE VIEW view_unpaid_debts AS
SELECT 
    d.id as debt_id,
    c.name as customer_name,
    c.whatsapp,
    b.name as branch_name,
    d.amount,
    d.paid_amount,
    (d.amount - d.paid_amount) as remaining_debt,
    d.due_date,
    d.status,
    CURRENT_DATE > d.due_date as is_overdue
FROM debts d
JOIN customers c ON d.customer_id = c.id
LEFT JOIN branches b ON d.branch_id = b.id
WHERE d.status != 'paid'
ORDER BY d.due_date ASC;

-- View 3: Courier Performance & Commissions
CREATE OR REPLACE VIEW view_courier_performance AS
SELECT 
    DATE(t.created_at) as performance_date,
    cr.id as courier_id,
    cr.name as courier_name,
    COUNT(t.id) as total_deliveries,
    SUM(t.total_gallons) as gallons_delivered,
    SUM(t.commission_amount) as estimated_commission
FROM transactions t
JOIN couriers cr ON t.courier_id = cr.id
WHERE t.transaction_type = 'delivery'
GROUP BY DATE(t.created_at), cr.id, cr.name
ORDER BY performance_date DESC, gallons_delivered DESC;
