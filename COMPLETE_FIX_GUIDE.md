# 🔧 PANDUAN LENGKAP PERBAIKAN LOGIN

## MASALAH YANG TERIDENTIFIKASI:

### 1. ❌ Database Column `last_login` Tidak Ada
- Login controller mencoba UPDATE column yang tidak exist
- Wrapped dalam try-catch tapi tetap bisa cause issues

### 2. ❌ Password Hash Tidak Match
- User ANO password hash di database tidak match dengan password manapun
- Perlu reset password

### 3. ❌ Environment Configuration
- Frontend `.env` tidak ada → API URL fallback ke `/api` (relative path)
- Backend DATABASE_URL mungkin salah/tidak reachable

## SOLUSI LENGKAP (IKUTI SEMUA STEPS):

### STEP 1: Fix Database Schema (WAJIB!)

Buka **Supabase SQL Editor** → Copy paste & run:

```sql
-- Add last_login column
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Reset password ANO (password baru: ano123)
UPDATE users 
SET password = '$2a$10$aIgbgHDbt6dQTzQsDlzJXuPltf2fIF3LG0Xgy7ociAmzHvt.Ftwga' 
WHERE username = 'ANO';

-- Verify hasil
SELECT username, role, branch_id, is_active FROM users WHERE username = 'ANO';
```

### STEP 2: Deploy Backend & Frontend

Code sudah diperbaiki dan akan auto-deploy ke:
- ✅ Vercel (Backend)
- ✅ Cloudflare Pages (Frontend)

**Tunggu 3-5 menit** setelah push git.

### STEP 3: Clear Browser Cache (WAJIB!)

Buka https://depo-app.pages.dev/login

Tekan **F12** → Console → Copy paste:

```javascript
// Clear ALL storage
localStorage.clear();
sessionStorage.clear();

// Unregister service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});

// Clear cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Hard reload
setTimeout(() => location.reload(true), 1000);
```

### STEP 4: Test Login

After hard reload, test login dengan:

**User ANO:**
- Username: `ANO`
- Password: `ano123`
- Branch: **KOSONGKAN**
- Click "MASUK KE SISTEM"

**User admin (fallback test):**
- Username: `admin`
- Password: `admin123`
- Branch: **KOSONGKAN**

### STEP 5: Verify di Console

Console harus menampilkan:

```
✅ Fetching branches from: https://depo-app-five.vercel.app/api/branches
✅ Branches API response status: 200 OK
✅ Branches loaded successfully: Array(4)

=== LOGIN ATTEMPT ===
Username: ANO
Branch selected: (kosong - otomatis dari database)

✅ AuthContext.login called: {username: "ANO", branch: ""}
✅ Login API response: {message: "Login berhasil", data: {...}}

=== LOGIN SUCCESS ===
User data: {username: "ANO", role: "admin", branch_name: "Cabang mangkupalas"}
```

---

## TROUBLESHOOTING:

### ❌ Jika Login Masih Gagal dengan "Username atau password salah"

Run di Supabase SQL Editor:
```sql
-- Check password hash user ANO
SELECT username, password FROM users WHERE username = 'ANO';

-- Jika hash berbeda, update lagi:
UPDATE users 
SET password = '$2a$10$aIgbgHDbt6dQTzQsDlzJXuPltf2fIF3LG0Xgy7ociAmzHvt.Ftwga' 
WHERE username = 'ANO';
```

### ❌ Jika Branches Tidak Load (Array kosong)

Test manual di Console:
```javascript
fetch('https://depo-app-five.vercel.app/api/branches')
  .then(r => r.json())
  .then(d => console.log('Branches:', d));
```

Expected: `{data: Array(4)}`

### ❌ Jika Error 500 "Server error"

Check Vercel logs:
1. Buka https://vercel.com/dashboard
2. Pilih project "depo-app"
3. Tab "Logs"
4. Lihat error message

Common issues:
- DATABASE_URL salah
- JWT_SECRET tidak di-set
- Database unreachable

---

## PERUBAHAN YANG DIBUAT:

### Backend:
1. ✅ Remove UPDATE last_login query (tidak diperlukan, bisa cause error)
2. ✅ Simplify login controller (fokus pada auth saja)
3. ✅ Add FIX_DATABASE.sql untuk fix schema

### Frontend:
1. ✅ Create .env untuk local development (VITE_API_URL)
2. ✅ Better error handling & logging
3. ✅ Branches fetch dengan fallback

### Database:
1. ✅ SQL script untuk add last_login column
2. ✅ SQL script untuk reset password ANO
3. ✅ Verification queries

---

## TESTING CREDENTIALS:

| Username | Password | Role | Branch |
|----------|----------|------|--------|
| admin | admin123 | admin | Depo Cg 178 |
| kasir | kasir123 | kasir | Depo Cg 178 |
| ANO | ano123 | admin | Cabang mangkupalas |
| MAKIN | makin123 | admin | cabang karpotek |
| HAMDAN | hamdan123 | admin | cabang merdeka |

---

## FINAL CHECKLIST:

- [ ] Run FIX_DATABASE.sql di Supabase
- [ ] Tunggu deploy selesai (3-5 menit)
- [ ] Clear browser cache dengan script di atas
- [ ] Hard reload (Ctrl+Shift+R)
- [ ] Test login dengan ANO/ano123
- [ ] Check console logs
- [ ] Verify redirect ke dashboard

**Jika semua steps sudah diikuti dan masih gagal, screenshot:**
1. Supabase SQL result untuk query verify users
2. Browser console lengkap
3. Network tab (F12 → Network) untuk request login
