-- Add delete request columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested_by INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMP;

-- Add index for faster queries on delete requests
CREATE INDEX IF NOT EXISTS idx_transactions_delete_requested ON transactions(delete_requested) WHERE delete_requested = TRUE;

-- Add foreign key constraint for delete_requested_by (references users table)
-- ALTER TABLE transactions ADD CONSTRAINT fk_transactions_delete_requested_by FOREIGN KEY (delete_requested_by) REFERENCES users(id);

-- Comment: Foreign key constraint commented out as users table structure may vary
-- Add it manually if your users table exists and has proper id column