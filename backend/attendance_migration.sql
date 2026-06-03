-- ===================================================================
-- ATTENDANCE TABLE MIGRATION - Create/Update attendance table structure
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Check if attendance table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'attendance'
    ) THEN
        -- Create attendance table
        CREATE TABLE attendance (
            id SERIAL PRIMARY KEY,
            courier_id INTEGER NOT NULL,
            branch_id INTEGER,
            date DATE DEFAULT CURRENT_DATE,
            check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            check_out_time TIMESTAMP,
            face_data TEXT,
            face_verified BOOLEAN DEFAULT FALSE,
            location_lat DECIMAL(10, 8),
            location_lng DECIMAL(11, 8),
            device_info VARCHAR(255),
            notes TEXT,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Attendance table created successfully';
    ELSE
        RAISE NOTICE 'Attendance table already exists';
    END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS courier_id INTEGER;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS branch_id INTEGER;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_data TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_info VARCHAR(255);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_courier_date ON attendance(courier_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- Success message
SELECT 'Attendance table migration completed successfully!' as status;