-- ===================================================================
-- RESET PASSWORD UNTUK SEMUA USER
-- Jalankan di Supabase SQL Editor
-- ===================================================================

-- Reset password untuk semua user (Password format: [username]123 lowercase)

-- User: admin | Password: admin123
UPDATE users SET password = '$2a$10$kZDrrP0UOdn/KbpQh0mFjeMq69CAb2YQ8WoarTE1e/YA5V4RNpYQG' WHERE username = 'admin';

-- User: kasir | Password: kasir123
UPDATE users SET password = '$2a$10$BkxXH.fdpuUBGUcQ0OKUnuLb.8vnNDvE/fSK1HjtCnp/kuU3hlrbS' WHERE username = 'kasir';

-- User: andi | Password: andi123
UPDATE users SET password = '$2a$10$0RDNUbrmyePRz6BwdOhyrekruuEdivBEh9lnxKh3S89hX4E097v1G' WHERE username = 'andi';

-- User: superadmin | Password: superadmin123
UPDATE users SET password = '$2a$10$IYkOA3odZxTd7.JEtKTdie.arM3WQVQ7Qjlz2ioOBnTgmZV5fIgNC' WHERE username = 'superadmin';

-- User: MAKIN | Password: makin123
UPDATE users SET password = '$2a$10$erCfNvyfLSR8kKLM850IhegfArwpBCNfrxXnAJSHt72XgO63HRcpy' WHERE username = 'MAKIN';

-- User: ANO | Password: ano123
UPDATE users SET password = '$2a$10$YsJSnHSKlOG3B7tYoCnGbOeer2Lv/tNTET5ymiEMLn9NeHIvi/uqW' WHERE username = 'ANO';

-- User: HAMDAN | Password: hamdan123
UPDATE users SET password = '$2a$10$9s5iUreHHLXMOaztHmgcQOy.yudQEBR3a15VJWezPsDnM3ZwHtX9y' WHERE username = 'HAMDAN';

-- User: SAID | Password: said123
UPDATE users SET password = '$2a$10$g7HpC1Fdsvt5SAgAH93kRea/m9SwJ0Or.bH1z.Z8Ly4qI.gjEOqt6' WHERE username = 'SAID';

-- Verify hasil update
SELECT 
  username, 
  role, 
  branch_id, 
  is_active,
  CASE 
    WHEN password LIKE '$2a$10$%' THEN '✅ Hash valid'
    ELSE '❌ Hash invalid'
  END as password_status
FROM users 
ORDER BY id;

-- ===================================================================
-- CREDENTIALS UNTUK LOGIN:
-- ===================================================================
-- Username: admin           | Password: admin123
-- Username: kasir           | Password: kasir123  
-- Username: andi            | Password: andi123
-- Username: superadmin      | Password: superadmin123
-- Username: MAKIN           | Password: makin123
-- Username: ANO             | Password: ano123
-- Username: HAMDAN          | Password: hamdan123
-- Username: SAID            | Password: said123
-- ===================================================================
