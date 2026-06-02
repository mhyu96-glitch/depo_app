# 🔐 LOGIN CREDENTIALS - SEMUA USER

## ✅ SUDAH DI-RESET & BERHASIL LOGIN:
- **ANO** / ano123 ✅ (Cabang mangkupalas)

## 📋 DAFTAR LENGKAP CREDENTIALS:

### Superadmin
| Username | Password | Role | Cabang | Status |
|----------|----------|------|--------|--------|
| admin | admin123 | admin | Depo Cg 178 | ⏳ Pending reset |
| superadmin | superadmin123 | superadmin | Depo Cg 178 | ⏳ Pending reset |

### Admin per Cabang
| Username | Password | Role | Cabang | Status |
|----------|----------|------|--------|--------|
| andi | andi123 | admin | Semua Cabang | ⏳ Pending reset |
| MAKIN | makin123 | admin | cabang karpotek | ⏳ Pending reset |
| ANO | ano123 | admin | Cabang mangkupalas | ✅ **BERHASIL** |
| HAMDAN | hamdan123 | admin | cabang merdeka | ⏳ Pending reset |
| SAID | said123 | admin | Depo Cg 178 | ⏳ Pending reset |

### Kasir
| Username | Password | Role | Cabang | Status |
|----------|----------|------|--------|--------|
| kasir | kasir123 | kasir | Depo Cg 178 | ⏳ Pending reset |

---

## 🔧 CARA RESET PASSWORD SEMUA USER:

### Step 1: Buka Supabase SQL Editor

Masuk ke Supabase → Pilih project → SQL Editor

### Step 2: Copy & Paste SQL Script

File: `backend/RESET_ALL_USERS.sql`

Atau copy dari sini:

```sql
-- Reset password semua user
UPDATE users SET password = '$2a$10$kZDrrP0UOdn/KbpQh0mFjeMq69CAb2YQ8WoarTE1e/YA5V4RNpYQG' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$BkxXH.fdpuUBGUcQ0OKUnuLb.8vnNDvE/fSK1HjtCnp/kuU3hlrbS' WHERE username = 'kasir';
UPDATE users SET password = '$2a$10$0RDNUbrmyePRz6BwdOhyrekruuEdivBEh9lnxKh3S89hX4E097v1G' WHERE username = 'andi';
UPDATE users SET password = '$2a$10$IYkOA3odZxTd7.JEtKTdie.arM3WQVQ7Qjlz2ioOBnTgmZV5fIgNC' WHERE username = 'superadmin';
UPDATE users SET password = '$2a$10$erCfNvyfLSR8kKLM850IhegfArwpBCNfrxXnAJSHt72XgO63HRcpy' WHERE username = 'MAKIN';
UPDATE users SET password = '$2a$10$YsJSnHSKlOG3B7tYoCnGbOeer2Lv/tNTET5ymiEMLn9NeHIvi/uqW' WHERE username = 'ANO';
UPDATE users SET password = '$2a$10$9s5iUreHHLXMOaztHmgcQOy.yudQEBR3a15VJWezPsDnM3ZwHtX9y' WHERE username = 'HAMDAN';
UPDATE users SET password = '$2a$10$g7HpC1Fdsvt5SAgAH93kRea/m9SwJ0Or.bH1z.Z8Ly4qI.gjEOqt6' WHERE username = 'SAID';

-- Verify
SELECT username, role, branch_id, is_active FROM users ORDER BY id;
```

### Step 3: Run Query

Klik tombol **Run** atau tekan **Ctrl+Enter**

Expected result: `UPDATE 8` (8 rows affected)

### Step 4: Test Login

Setelah reset, test login untuk semua user:

```
https://depo-app.pages.dev/login
```

Test dengan credentials di tabel atas.

---

## 🧪 TESTING CHECKLIST:

- [ ] admin / admin123
- [ ] kasir / kasir123
- [ ] andi / andi123
- [ ] superadmin / superadmin123
- [ ] MAKIN / makin123
- [x] ANO / ano123 ✅
- [ ] HAMDAN / hamdan123
- [ ] SAID / said123

---

## 📝 NOTES:

1. **Password format**: `[username]123` (semua lowercase)
   - Contoh: username `MAKIN` → password `makin123`
   - Contoh: username `admin` → password `admin123`

2. **Branch dropdown**: KOSONGKAN (login otomatis ke cabang user)

3. **Jika masih gagal login**:
   - Clear browser cache (Ctrl+Shift+R)
   - Clear localStorage di Console:
     ```javascript
     localStorage.clear();
     location.reload();
     ```
   - Verify password di database:
     ```sql
     SELECT username, password FROM users WHERE username = 'USERNAME_HERE';
     ```

4. **Password hash harus diawali dengan**: `$2a$10$`
   - Jika beda → run RESET_ALL_USERS.sql lagi

---

## 🔒 KEAMANAN:

⚠️ **PENTING**: Setelah semua user berhasil login, WAJIB ganti password!

Cara ganti password:
1. Login ke aplikasi
2. Menu Pengaturan → Ubah Password
3. Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf besar/kecil/angka)

Jangan gunakan password default (username123) untuk production!
