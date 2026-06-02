# 🎉 DOKUMENTASI FITUR BARU V3

## 📋 RINGKASAN 7 FITUR BARU:

### ✅ 1. Role System - Admin Cabang vs Superadmin

**Branch Admin (MAKIN, ANO, HAMDAN, SAID):**
- ❌ TIDAK bisa lihat laba rugi
- ✅ Hanya bisa lihat laporan penjualan
- ✅ Akses terbatas ke cabang sendiri

**Admin Pusat & Superadmin:**
- ✅ Bisa lihat semua laporan termasuk laba rugi
- ✅ Akses lintas cabang

**Implementation:**
- Database: Role `branch_admin` untuk MAKIN, ANO, HAMDAN, SAID
- Backend: RBAC middleware updated
- Routes: `/api/reports/*` dengan restriction

---

### ✅ 2. Approval System - Kasir Butuh Izin Admin

**Flow:**
1. Kasir ingin edit/delete transaksi → Request approval
2. Admin melihat pending approvals
3. Admin approve/reject
4. Jika approved → action dijalankan

**Endpoints:**
```
POST /api/approvals/request-edit     - Kasir request edit
POST /api/approvals/request-delete   - Kasir request delete
POST /api/approvals/process          - Admin approve/reject
GET  /api/approvals/pending          - List pending approvals
GET  /api/approvals/history/:tx_id   - History per transaksi
```

**Database Table:** `transaction_approvals`

---

### ✅ 3. Transaction Code System

**Format Kode:**
- **Pickup** (Beli Langsung): `PKP-20260602-0001`
- **Delivery** (Diantar): `DLV-20260602-0001`

**Auto-generated** saat create transaction.

**Columns Added:**
- `transaction_code` VARCHAR(50) UNIQUE
- `delivery_type` VARCHAR(20) ('pickup' or 'delivery')
- `customer_name` VARCHAR(100)
- `customer_phone` VARCHAR(20)
- `delivery_address` TEXT
- `courier_id` INTEGER

**Utility:** `backend/src/utils/transactionCode.js`

---

### ✅ 4. Rolling Kasir - Sudah Ada!

**Endpoints yang sudah ada:**
```
POST /api/users/courier-to-kasir  - Convert kurir → kasir
POST /api/users/kasir-to-courier  - Convert kasir → kurir
```

**Notes:** Fitur ini sudah diimplementasi di TASK 6 sebelumnya.

---

### ✅ 5. Attendance dengan Face Recognition

**Features:**
- ✅ Check-in dengan timestamp
- ✅ Check-out dengan timestamp
- ✅ Face data capture (base64)
- ✅ Face verification
- ✅ GPS location (lat/lng)
- ✅ Device info tracking

**Endpoints:**
```
POST /api/attendance/checkin         - Check-in dengan face
POST /api/attendance/checkout        - Check-out
GET  /api/attendance/today           - Attendance hari ini
GET  /api/attendance/history         - History attendance
POST /api/attendance/register-face   - Register face kurir
GET  /api/attendance/face/:courier_id - Get face kurir
```

**Database Tables:**
- `attendance` - Updated dengan face columns
- `courier_faces` - Store registered faces

**Columns:**
- `check_in_time` TIMESTAMP
- `check_out_time` TIMESTAMP
- `face_data` TEXT (base64 image)
- `face_verified` BOOLEAN
- `location_lat` DECIMAL(10,8)
- `location_lng` DECIMAL(11,8)
- `device_info` VARCHAR(255)

---

### ✅ 6. Audit Logging

**Track semua perubahan penting:**
- User actions
- Data modifications
- Approval decisions

**Database Table:** `audit_logs`
- `user_id`, `action`, `table_name`, `record_id`
- `old_data`, `new_data` (JSONB)
- `ip_address`, `user_agent`
- `created_at`

---

### ✅ 7. Fix Bug Edit Produk

**Status:** Product controller sudah OK.

**Kemungkinan masalah di frontend:**
- Field validation
- API call format
- State management

**Next Steps:** Perlu cek frontend Products.jsx

---

## 🔧 SETUP INSTRUCTIONS:

### 1. **RUN MIGRATION (WAJIB!)**

Buka **Supabase SQL Editor** → Run file:
```
backend/src/models/migration_v3_complete.sql
```

Script ini akan:
- Update role MAKIN/ANO/HAMDAN/SAID → branch_admin
- Add columns ke transactions
- Add columns ke attendance
- Create tables: transaction_approvals, courier_faces, audit_logs

### 2. **Update User Roles**

```sql
-- Sudah included di migration, tapi verify:
SELECT username, role, branch_id FROM users ORDER BY role;

-- Expected:
-- superadmin → role: superadmin
-- admin → role: admin
-- MAKIN, ANO, HAMDAN, SAID → role: branch_admin
-- kasir → role: kasir
```

### 3. **Test Endpoints**

**Test Approval System:**
```bash
# Kasir request delete
curl -X POST http://localhost:5000/api/approvals/request-delete \
  -H "Authorization: Bearer KASIR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": 1, "reason": "Input salah"}'

# Admin approve
curl -X POST http://localhost:5000/api/approvals/process \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approval_id": 1, "status": "approved"}'
```

**Test Attendance:**
```bash
# Check-in dengan face
curl -X POST http://localhost:5000/api/attendance/checkin \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courier_id": 1,
    "face_data": "base64_image_string",
    "location_lat": -6.2088,
    "location_lng": 106.8456,
    "device_info": "Chrome/Mobile"
  }'
```

---

## 📊 DATABASE SCHEMA CHANGES:

### New Tables:
1. **transaction_approvals** - Approval workflow
2. **courier_faces** - Face recognition data
3. **audit_logs** - System audit trail

### Updated Tables:
1. **users** - Added role `branch_admin`
2. **transactions** - Added transaction_code, delivery_type, etc.
3. **attendance** - Added face recognition columns

---

## 🔐 PERMISSION MATRIX:

| Feature | Kasir | Branch Admin | Admin Pusat | Superadmin |
|---------|-------|--------------|-------------|------------|
| Lihat Laporan Penjualan | ❌ | ✅ | ✅ | ✅ |
| Lihat Laporan Salary | ❌ | ❌ | ✅ | ✅ |
| Lihat Laba Rugi | ❌ | ❌ | ✅ | ✅ |
| Edit Transaksi | Request | Approve | Approve | Approve |
| Delete Transaksi | Request | Approve | Approve | Approve |
| Attendance Check-in | ✅ | ✅ | ✅ | ✅ |
| Register Face | ❌ | ✅ | ✅ | ✅ |
| Akses Lintas Cabang | ❌ | ❌ | ✅ | ✅ |

---

## 🐛 KNOWN ISSUES & TODO:

### Frontend (Perlu Diimplementasi):
1. ❌ UI untuk approval workflow
2. ❌ Face recognition camera interface
3. ❌ Transaction code display
4. ❌ Fix bug edit produk (jika masih ada)
5. ❌ Restriction UI untuk branch_admin (hide laba rugi menu)

### Backend (Sudah Selesai):
- ✅ RBAC system
- ✅ Approval endpoints
- ✅ Transaction code generation
- ✅ Attendance with face
- ✅ Database migration

---

## 📝 NEXT STEPS:

1. **Deploy Backend:**
   - Push ke GitHub
   - Vercel auto-deploy

2. **Run Migration:**
   - Jalankan migration_v3_complete.sql di Supabase

3. **Test API:**
   - Test semua endpoints baru
   - Verify permissions

4. **Update Frontend:**
   - Implement approval UI
   - Implement face recognition
   - Hide laba rugi dari branch_admin
   - Fix product edit bug

5. **Testing:**
   - Test dengan user MAKIN (branch_admin)
   - Test approval flow
   - Test attendance check-in

---

## 💡 TIPS:

- **Transaction Code** auto-generate, no manual input needed
- **Face Recognition** bisa di-skip untuk MVP (optional)
- **Approval System** critical untuk kasir workflow
- **Branch Admin** harus test bahwa mereka tidak bisa akses laba rugi

Silakan test dan beri tahu jika ada yang perlu diperbaiki!
