# 🔧 FIX CORS ERROR - Complete Guide

## 🚨 ERROR YANG TERJADI:

```
Access to XMLHttpRequest at 'https://depo-app-five.vercel.app/api/auth/login' from origin 'https://depo-app.pages.dev' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ SOLUSI YANG SUDAH DITERAPKAN:

### 1. **Update CORS Configuration**
- ✅ Allow semua `.pages.dev` origins
- ✅ Allow `depo-app` domains
- ✅ Add explicit CORS headers
- ✅ Handle OPTIONS preflight requests
- ✅ Permissive mode untuk production

### 2. **Additional Headers Middleware**
```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

---

## 🔄 LANGKAH SETELAH DEPLOY:

### STEP 1: Tunggu Deploy Selesai (3-5 menit)
- ✅ Backend di Vercel auto-deploy
- ✅ Frontend di Cloudflare Pages auto-deploy

### STEP 2: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### STEP 3: Clear Browser Cache & Storage

Buka Console (F12) → Copy paste:

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

// Reload
setTimeout(() => location.reload(true), 1000);
```

### STEP 4: Test Login Lagi

Setelah clear cache:
- Username: `ANO`
- Password: `ano123`
- Branch: **KOSONGKAN**

---

## 🧪 TROUBLESHOOTING:

### ❌ Jika Masih CORS Error:

#### 1. **Check Vercel Deployment**
- Buka https://vercel.com/dashboard
- Pastikan deployment **Success** dan **Latest commit** sudah terdeploy
- Lihat Logs untuk error CORS

#### 2. **Check Backend Health**
Test di Console:
```javascript
fetch('https://depo-app-five.vercel.app/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Backend Error:', e));
```

Expected: `{status: "ok", timestamp: "..."}`

#### 3. **Check CORS Headers**
Test di Console:
```javascript
fetch('https://depo-app-five.vercel.app/api/branches', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://depo-app.pages.dev',
    'Access-Control-Request-Method': 'GET'
  }
})
.then(r => {
  console.log('✅ Preflight OK');
  console.log('Headers:', [...r.headers.entries()]);
})
.catch(e => console.error('❌ Preflight Failed:', e));
```

Expected headers:
- `access-control-allow-origin: https://depo-app.pages.dev`
- `access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS`
- `access-control-allow-headers: Content-Type, Authorization, Accept`

#### 4. **Test Login API Directly**
```javascript
fetch('https://depo-app-five.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://depo-app.pages.dev'
  },
  body: JSON.stringify({
    username: 'ANO',
    password: 'ano123',
    branch: ''
  })
})
.then(r => r.json())
.then(d => {
  console.log('✅ Login API Response:', d);
  if (d.data?.token) {
    console.log('✅ LOGIN BERHASIL!');
  }
})
.catch(e => console.error('❌ Login Error:', e));
```

---

## 🔍 ALTERNATIF SOLUTIONS:

### Option 1: Gunakan Proxy (Jika CORS masih gagal)

Update `frontend/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://depo-app-five.vercel.app',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

### Option 2: Deploy Frontend di Vercel Juga

Jika Cloudflare Pages terus block CORS:
1. Deploy frontend ke Vercel (same domain)
2. Update `FRONTEND_URL` di Vercel environment variables

### Option 3: Use Custom Domain

Setup custom domain untuk menghindari CORS:
- Backend: api.depo178.site
- Frontend: app.depo178.site
- Same root domain → No CORS issues

---

## ✅ VERIFICATION CHECKLIST:

Setelah deploy dan clear cache:

- [ ] Backend health check berhasil (status: ok)
- [ ] Preflight OPTIONS request berhasil
- [ ] CORS headers present di response
- [ ] Login API berhasil return token
- [ ] No CORS error di Console
- [ ] User bisa redirect ke dashboard

---

## 📝 LOGS TO CHECK:

### Browser Console:
```
✅ Fetching branches from: https://depo-app-five.vercel.app/api/branches
✅ Branches API response status: 200 OK
✅ Branches loaded successfully: Array(4)

=== LOGIN ATTEMPT ===
Username: ANO
✅ AuthContext.login called
✅ Login API response: {message: "Login berhasil", ...}
```

### Vercel Logs:
```
✅ Request received: POST /api/auth/login
✅ CORS origin allowed: https://depo-app.pages.dev
✅ Login successful: {username: "ANO", role: "admin"}
```

---

## 🆘 JIKA SEMUA GAGAL:

1. Screenshot console error lengkap
2. Screenshot Network tab (F12 → Network)
3. Screenshot Vercel deployment logs
4. Beri tahu:
   - Browser & version
   - URL yang diakses
   - User yang ditest
   - Error message lengkap

Saya akan bantu troubleshoot lebih lanjut!

---

## 🎯 EXPECTED RESULT:

Setelah fix ini:
- ✅ No CORS errors
- ✅ Login berhasil untuk ANO
- ✅ Redirect ke dashboard
- ✅ Data loaded properly

**Tunggu deploy selesai (3-5 menit), lalu test!** 🚀
