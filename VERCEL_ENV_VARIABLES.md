# 🔐 Environment Variables untuk Vercel

**Gunakan ENV ini saat setup Vercel project baru**

---

## 📋 ENVIRONMENT VARIABLES (Production):

### 1. DATABASE_URL
**Value**: (Ambil dari Supabase Dashboard)

Cara dapat:
1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **"Settings"** → **"Database"**
4. Scroll ke **"Connection String"**
5. Tab **"URI"** → Copy string yang ada
6. Format: `postgresql://postgres.xxx:[PASSWORD]@xxx.supabase.co:5432/postgres`

**⚠️ PENTING**: Ganti `[PASSWORD]` dengan database password Supabase Anda!

---

### 2. JWT_SECRET
**Value**: `depo_air_minum_super_secret_key_2024_change_in_production`

(Atau buat secret baru yang lebih kuat)

---

### 3. JWT_EXPIRES_IN
**Value**: `7d`

(Token valid selama 7 hari)

---

### 4. FRONTEND_URL
**Value**: `https://depo-app.pages.dev`

(URL frontend Cloudflare Pages Anda)

---

### 5. DEMO_MODE
**Value**: `false`

---

### 6. PORT (Optional)
**Value**: `5000`

(Vercel auto-detect, tapi bisa di-set juga)

---

## ✅ CARA INPUT KE VERCEL:

Saat setup project baru di Vercel:

1. Di section **"Environment Variables"**
2. Klik **"Add"**
3. Input:
   - **Name**: `DATABASE_URL`
   - **Value**: (paste connection string Supabase)
   - **Environment**: Centang **Production**, **Preview**, **Development**
4. Klik **"Add"** lagi untuk variable berikutnya
5. Ulangi untuk semua 5-6 variables di atas

---

## 🔍 JIKA TIDAK TAHU DATABASE_URL:

Jika Anda tidak ingat/tidak tahu DATABASE_URL Supabase:

### Cara 1: Check di Supabase
1. Login ke https://supabase.com/dashboard
2. Pilih project
3. Settings → Database → Connection String (URI)

### Cara 2: Check dari Vercel Logs
1. Di Vercel Dashboard (sebelum delete project)
2. Klik deployment → View Function Logs
3. Lihat apakah ada log connection string (biasanya ada di error logs)

### Cara 3: Test Database Connection
Jika sudah punya username & password Supabase, formatnya:
```
postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

Ganti:
- `[YOUR_PASSWORD]` dengan password database Supabase
- `[PROJECT_REF]` dengan project reference (di URL Supabase)

---

## 📝 CHECKLIST SEBELUM DELETE PROJECT:

- [ ] Punya akses ke Supabase Dashboard (bisa dapat DATABASE_URL)
- [ ] Tahu frontend URL: `https://depo-app.pages.dev`
- [ ] JWT_SECRET dicatat: `depo_air_minum_super_secret_key_2024_change_in_production`
- [ ] Semua ENV variables di file ini sudah siap

Kalau semua ✓, **aman untuk delete project & reconnect!**

---

## 🚀 NEXT STEPS:

1. ✅ Backup ENV (file ini sudah cukup)
2. ⏳ Delete Vercel project
3. ⏳ Reconnect GitHub repo
4. ⏳ Input ENV variables dari file ini
5. ⏳ Deploy!

**Siap untuk delete project?** 🔥
