-- ===================================================================
-- MIGRATION VOUCHER SYSTEM - Tambah support untuk sistem voucher/kupon
-- Jalankan di Supabase SQL Editor
-- ===================================================================

-- Tambah kolom voucher ke tabel transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_type VARCHAR(20);

-- Tambah index untuk performa query voucher report
CREATE INDEX IF NOT EXISTS idx_transactions_voucher_code ON transactions(voucher_code);
CREATE INDEX IF NOT EXISTS idx_transactions_voucher_type ON transactions(voucher_type);

-- Tambah constraint untuk voucher_type (opsional, sesuai kebutuhan)
-- ALTER TABLE transactions ADD CONSTRAINT chk_voucher_type 
-- CHECK (voucher_type IS NULL OR voucher_type IN ('BL', 'DL', 'manual'));

-- Verify struktur tabel setelah migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name LIKE '%voucher%'
ORDER BY ordinal_position;

-- Test query untuk voucher report
-- SELECT 
--   DATE(created_at) as date,
--   COUNT(*) as total_vouchers,
--   SUM(voucher_discount) as total_discount,
--   COUNT(CASE WHEN voucher_type = 'BL' THEN 1 END) as bl_count,
--   COUNT(CASE WHEN voucher_type = 'DL' THEN 1 END) as dl_count,
--   COUNT(CASE WHEN voucher_type IS NULL OR voucher_type = 'manual' THEN 1 END) as manual_count
-- FROM transactions 
-- WHERE voucher_code IS NOT NULL 
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

COMMIT;