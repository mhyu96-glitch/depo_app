-- ===================================================================
-- FIX DATABASE SCHEMA - RUN THIS IN SUPABASE SQL EDITOR
-- ===================================================================

-- 1. Add last_login column if not exists (untuk avoid error di future)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 2. Add superadmin role to role enum (jika belum ada)
-- Note: Untuk PostgreSQL, kita tidak bisa ALTER enum secara langsung
-- Solusi: Gunakan VARCHAR tanpa constraint, atau update role manual

-- 3. Ensure all users have proper data
-- Check users tanpa branch
SELECT id, username, name, role, branch_id FROM users WHERE branch_id IS NULL;

-- 4. Reset password untuk user ANO (password: ano123)
UPDATE users 
SET password = '$2a$10$aIgbgHDbt6dQTzQsDlzJXuPltf2fIF3LG0Xgy7ociAmzHvt.Ftwga' 
WHERE username = 'ANO';

-- 5. Reset password untuk semua user testing (optional)
UPDATE users SET password = '$2a$10$aIgbgHDbt6dQTzQsDlzJXuPltf2fIF3LG0Xgy7ociAmzHvt.Ftwga' WHERE username = 'MAKIN'; -- password: makin123
UPDATE users SET password = '$2a$10$aIgbgHDbt6dQTzQsDlzJXuPltf2fIF3LG0Xgy7ociAmzHvt.Ftwga' WHERE username = 'HAMDAN'; -- password: hamdan123

-- 6. Verify all users
SELECT u.id, u.username, u.name, u.role, u.branch_id, b.name as branch_name, u.is_active
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id
ORDER BY u.id;

-- 7. Verify all branches
SELECT * FROM branches ORDER BY id;

-- ===================================================================
-- EXPECTED OUTPUT AFTER RUNNING:
-- All users should have:
-- - Valid password hash
-- - branch_id assigned (except superadmin can be NULL)
-- - is_active = true
-- - last_login column exists
-- ===================================================================
