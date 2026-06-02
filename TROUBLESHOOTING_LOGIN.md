# 🔧 Troubleshooting Login Error

## Masalah: "Uncaught SyntaxError: Unexpected identifier 'parsing'"

### Penyebab:
1. **Browser Extension** yang interfere dengan JavaScript
2. **Cached JavaScript** yang corrupt/outdated
3. **Service Worker** yang cache file lama

### Solusi (Lakukan SEMUA langkah ini):

#### 1. Hard Refresh & Clear Cache
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### 2. Clear All Storage
Buka Console (F12) → ketik:
```javascript
// Clear semua storage
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('depo');

// Unregister service workers
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});

// Reload
location.reload(true);
```

#### 3. Disable Browser Extensions
1. Buka mode Incognito/Private browsing
2. Test login di sana (extensions biasanya disabled)
3. Jika berhasil → matikan extensions satu per satu untuk cari yang bermasalah

#### 4. Clear Browser Cache Manual
Chrome:
1. Settings → Privacy and security
2. Clear browsing data
3. Pilih: Cached images and files
4. Time range: All time
5. Clear data

#### 5. Test API Manual
Buka Console → ketik:
```javascript
// Test Branches API
fetch('https://depo-app-five.vercel.app/api/branches')
  .then(r => r.json())
  .then(d => console.log('✅ Branches:', d))
  .catch(e => console.error('❌ Error:', e));

// Test Login API (ganti USERNAME dan PASSWORD)
fetch('https://depo-app-five.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'ANO',
    password: 'ano123',
    branch: ''
  })
})
.then(r => r.json())
.then(d => console.log('✅ Login:', d))
.catch(e => console.error('❌ Login error:', e));
```

Expected result:
```json
{
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": 6,
      "username": "ANO",
      "role": "admin",
      "branch_name": "Cabang mangkupalas"
    }
  }
}
```

#### 6. Jika Password Salah
Jalankan di Supabase SQL Editor:

```sql
-- Reset password ANO ke 'ano123'
UPDATE users 
SET password = '$2a$10$YourHashHere' 
WHERE username = 'ANO';

-- Atau generate hash baru:
-- Di backend folder, run: node generate_password.js
```

#### 7. Test Username/Password yang Pasti Bekerja
Coba login dengan kredensial demo:
- Username: `admin`
- Password: `admin123`
- Branch: Kosongkan

Jika ini berhasil → masalahnya di password user ANO
Jika ini gagal → masalah di browser/cache

---

## Checklist Debugging

- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear localStorage & sessionStorage
- [ ] Unregister service workers
- [ ] Test di Incognito mode
- [ ] Disable all extensions
- [ ] Clear browser cache
- [ ] Test branches API manual (berhasil?)
- [ ] Test login API manual (berhasil?)
- [ ] Try demo credentials (admin/admin123)
- [ ] Check password hash di database

---

## Error Messages & Solusi

| Error | Penyebab | Solusi |
|-------|----------|--------|
| "Unexpected identifier 'parsing'" | Browser extension/cache | Clear cache, disable extensions |
| "Username atau password salah" | Password incorrect | Reset password di database |
| "Network error" | API tidak respond | Check Vercel deployment |
| No error, stuck loading | Infinite loop | Check console, clear storage |
| Redirect loop | Token invalid | Clear localStorage |

---

## Jika Semua Gagal

1. Screenshot console dengan semua errors
2. Screenshot Network tab (F12 → Network)
3. Beri tahu:
   - Browser & version
   - Extensions yang diinstall
   - Error message lengkap
   - Hasil test API manual
