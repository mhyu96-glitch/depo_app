# PRD - Sistem Manajemen Depo Air Minum

Tanggal audit: 2026-06-05

## Ringkasan Produk

Aplikasi ini adalah sistem manajemen operasional depo air minum berbasis web untuk mengelola cabang, kasir/POS, pelanggan, pengiriman galon, stok, kurir, absensi, arus kas, laporan, hutang, aset, armada, WhatsApp, IoT, dan portal pelanggan.

Tujuan utama aplikasi adalah menjadi command center harian depo air minum: transaksi kasir tercatat, pesanan delivery bisa diambil kurir, pelanggan mendapat loyalty/voucher, admin bisa memantau performa cabang, dan superadmin bisa melihat laporan bisnis lintas cabang.

## Target Pengguna

- Superadmin: akses penuh lintas cabang, laporan laba rugi, audit, konfigurasi bisnis.
- Admin pusat: akses lintas cabang untuk operasional, produk, user, laporan utama.
- Branch admin: mengelola cabang sendiri tanpa akses penuh ke laporan sensitif.
- Kasir: POS, transaksi, pelanggan, cashflow, absensi dasar.
- Kurir: melihat dan mengambil tugas delivery, memperbarui status pengiriman.
- Pelanggan: cek poin/voucher dan membuat pesanan melalui portal publik.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Framer Motion, Recharts, Leaflet, PWA.
- Backend: Node.js, Express, PostgreSQL/Supabase, JWT, bcryptjs.
- Deployment config: Vercel untuk frontend/API proxy, Render/Railway style backend config.
- Database: PostgreSQL dengan schema utama di `backend/src/models`.

## Modul Produk

### Auth dan Role

Login JWT, validasi user aktif, role `superadmin`, `admin`, `branch_admin`, dan `kasir`. Frontend memakai private route untuk membatasi halaman. Backend memakai middleware auth dan RBAC.

### Dashboard

Menampilkan widget performa, tren penjualan bulanan/harian, perbandingan cabang, proyeksi AI, dan business health.

### POS dan Transaksi

Membuat transaksi pickup/delivery, item transaksi, invoice, metode/status pembayaran, komisi, voucher, loyalty, otomatisasi cashflow untuk cash, dan pengurangan stok operasional.

### Pelanggan dan Loyalty

CRUD pelanggan, pencarian pelanggan, voucher code, loyalty count, detail pelanggan, barcode/member code, dan portal publik untuk cek poin serta riwayat pembelian.

### Delivery dan Kurir

Daftar order delivery, kurir mengambil tugas, status berubah ke `on_way` atau `delivered`, dan data pengiriman dikaitkan dengan pelanggan.

### Cabang dan Multi-Branch

CRUD cabang, filter cabang di transaksi, pelanggan, inventory, cashflow, expense, dan role cabang. `superadmin/admin` lintas cabang, `branch_admin/kasir` dibatasi cabang sendiri.

### Inventory

Melihat stok, log stok, update stok masuk/keluar, dan otomatisasi pengurangan stok saat transaksi galon.

### Absensi

Absensi kurir, riwayat absensi, face attendance sederhana, register face, dan checkout.

### Cashflow, Expense, Debt

Pencatatan pemasukan/pengeluaran, statistik expense, hutang dari transaksi unpaid/partial, pembayaran hutang, dan reminder WhatsApp.

### Laporan

Sales report, salary report, cashflow report, debt report, profit-loss, dan voucher report.

### Operasional Lanjutan

Fleet maintenance, asset health, audit log, WhatsApp center, IoT monitor, procurement/supplier, shift management, payroll, maps pelanggan.

## Kebutuhan Fungsional Prioritas

1. User dapat login sesuai role dan hanya melihat data yang sesuai cabang/izin.
2. Kasir dapat membuat transaksi pickup/delivery dengan item, pelanggan, pembayaran, voucher, dan total yang benar.
3. Transaksi cash otomatis masuk ke cashflow.
4. Transaksi galon otomatis mengurangi inventory pendukung.
5. Pelanggan dapat dicari, dibuat, diubah, dan mendapatkan loyalty.
6. Pelanggan dapat cek akun serta membuat order dari portal publik.
7. Kurir dapat melihat order delivery terbuka, mengambil tugas, dan menyelesaikan pengiriman.
8. Admin dapat mengelola produk, cabang, kurir, user, inventory, expense, dan laporan.
9. Superadmin/admin pusat dapat melihat laporan bisnis lintas cabang.
10. Sistem menyimpan audit trail untuk aksi penting.

## Kebutuhan Non-Fungsional

- Keamanan: JWT wajib untuk endpoint operasional; public endpoint hanya portal pelanggan.
- Multi-branch safety: branch_admin/kasir tidak boleh akses data cabang lain.
- Reliability: transaksi harus atomic memakai database transaction.
- Performance: data besar perlu pagination/filter pada transaksi, pelanggan, audit, dan laporan.
- Observability: log debug sebaiknya dibatasi di produksi.
- PWA: frontend bisa di-cache dan diakses sebagai app-like experience.

## Bug yang Ditemukan dan Status

| Prioritas | Area | Bug | Dampak | Solusi | Status |
|---|---|---|---|---|---|
| P0 | Absensi | Frontend mengirim check-in ke `POST /attendance`, backend hanya menyediakan `POST /attendance/checkin`. | Absensi manual gagal atau masuk ke route yang salah. | Ubah `attendanceApi.checkIn` ke `/attendance/checkin`. | Sudah diperbaiki |
| P0 | Delivery kurir | Route `GET /transactions/courier/:courierId` diletakkan setelah `GET /transactions/:id`. | URL kurir dianggap sebagai `id = courier`, delivery kurir gagal. | Pindahkan route courier sebelum `/:id`. | Sudah diperbaiki |
| P0 | Portal pelanggan | Portal publik selalu memakai baseURL `/api`, mengabaikan `VITE_API_URL`. | Portal gagal saat frontend dan backend beda domain. | Gunakan `import.meta.env.VITE_API_URL || '/api'`. | Sudah diperbaiki |
| P0 | Portal order | Backend `placeOrder` menolak guest order karena selalu mencari `customer_id`; frontend lalu menampilkan sukses palsu dari fallback catch. | Pesanan tamu tidak benar-benar tersimpan walaupun UI terlihat berhasil. | Izinkan guest order, simpan transaksi dengan customer null, nama tamu, phone/note, dan response `invoice/total`. | Sudah diperbaiki |
| P1 | Schema inventory | Schema utama memakai `current_stock`, controller memakai kolom `current` dan `type`. | Inventory list/update dan auto-deduction dapat error jika schema yang dipakai belum dimigrasi. | Samakan schema dan controller: pilih `current_stock` atau migrasikan kolom `current` + `type`; hindari hardcoded id inventory. | Perlu perbaikan lanjutan |
| P1 | Schema produk | Controller produk memakai `is_active`, schema utama `products` tidak mendefinisikan kolom ini. | Toggle/nonaktif produk bisa error di database baru. | Tambahkan migration `products.is_active BOOLEAN DEFAULT TRUE`. | Perlu perbaikan lanjutan |
| P1 | Schema pelanggan | Controller membuat `barcode_code`, schema utama belum memuat kolom ini kecuali migration v2. | Tambah pelanggan bisa gagal pada DB yang hanya memakai schema utama. | Masukkan `barcode_code` ke schema final dan migration produksi. | Perlu perbaikan lanjutan |
| P1 | Schema transaksi | Controller transaksi memakai `customer_name`, `total_gallons`, `voucher_*`, `delete_requested`, dll. Sebagian ada di migration terpisah, bukan schema final. | Deploy DB baru rawan gagal saat membuat transaksi. | Buat satu schema final atau migration berurutan yang wajib dijalankan. | Perlu perbaikan lanjutan |
| P1 | Absensi DB | Schema utama `attendance.date` `NOT NULL`, tetapi controller insert hanya `courier_id`. | Check-in bisa gagal jika default date belum ada atau migration tidak konsisten. | Insert `branch_id`, `date`, `check_in_time`, `face_data`, lokasi sesuai schema final. | Perlu perbaikan lanjutan |
| P1 | CORS | Backend memakai `origin: '*'` bersama `credentials: true` dan header manual permissive. | Tidak aman dan secara CORS bisa bermasalah untuk credentialed requests. | Batasi origin dari env `ALLOWED_ORIGINS`, hapus credentials jika token hanya via Authorization. | Perlu perbaikan lanjutan |
| P2 | Logging auth | Middleware auth mencetak debug untuk setiap request. | Log produksi berisik dan berpotensi membocorkan pola request. | Aktifkan debug hanya saat `NODE_ENV !== 'production'`. | Perlu perbaikan lanjutan |
| P2 | PWA build temp | Build PWA gagal jika temp default user tidak dapat diakses PowerShell/sandbox. | CI/lokal tertentu gagal di tahap akhir build. | Set `TMP/TEMP` ke folder workspace/CI atau konfigurasi env build. | Workaround terverifikasi |
| P2 | Bundle size | Chunk vendor > 1000 kB. | Load awal lambat. | Tambah lazy route/dynamic import untuk halaman berat. | Perlu optimasi |

## Perubahan yang Sudah Dilakukan

- `frontend/src/api/index.js`: `attendanceApi.checkIn` memakai `/attendance/checkin`.
- `backend/src/routes/transactions.routes.js`: route `/courier/:courierId` dipindah sebelum `/:id`.
- `frontend/src/pages/CustomerPortal.jsx`: public API memakai `VITE_API_URL`.
- `backend/src/controllers/customerPortalController.js`: guest order portal dapat tersimpan, total/invoice dikirim sesuai kebutuhan UI.

## Rekomendasi Backlog Perbaikan

1. Buat satu migration final yang menyatukan semua kolom yang dipakai controller.
2. Rapikan inventory controller agar tidak bergantung pada id tetap `1`, `3`, `4`; gunakan kode/nama item per cabang.
3. Tambahkan validasi input backend untuk transaksi, pelanggan, produk, cabang, dan portal order.
4. Batasi CORS berdasarkan environment.
5. Tambahkan pagination untuk transaksi dan audit log.
6. Tambahkan integration test minimal untuk auth, POS create transaction, portal order, attendance check-in, dan courier delivery route.
7. Lazy-load halaman frontend besar untuk menurunkan bundle awal.

## Verifikasi

- Backend berhasil di-load dengan `node -e "require('./server'); console.log('backend loaded')"`.
- Frontend berhasil build dengan `npm.cmd run build` setelah `TMP/TEMP` diarahkan ke folder workspace.
- Build masih memberi warning chunk besar, tetapi bukan error fungsional.

## Audit Tambahan - 2026-06-05

### Bug yang Sudah Diperbaiki Setelah Audit Lanjutan

- Portal kurir diubah menjadi assigned-only: kurir hanya melihat transaksi delivery yang dipilihkan kasir melalui `courier_id`.
- Tombol/konsep `CLAIM ORDER` dan `Global Task Pool` di portal kurir dihapus.
- Endpoint claim backend sekarang menolak kurir mengambil tugas sendiri.
- Login/auth sekarang menyertakan `courier_id` dari relasi `couriers.user_id`, sehingga portal kurir tahu identitas kurir aktif.
- Endpoint tugas kurir `/transactions/courier/:courierId` dibatasi agar akun kurir tidak bisa melihat tugas kurir lain.
- Update status delivery dibatasi agar kurir hanya bisa mengubah status tugas miliknya.
- Absensi diperbaiki agar insert kompatibel dengan beberapa variasi schema `attendance` yang ada di repo.
- Query absensi sekarang join ke `couriers`, sehingga frontend mendapat `courier_name`.
- Tampilan absensi frontend dibuat aman jika `courier_name` atau format jam masuk kosong.
- Detail/update/delete pelanggan sekarang dibatasi sesuai cabang untuk role `branch_admin` dan `kasir`.
- Detail transaksi sekarang dibatasi sesuai cabang untuk role `branch_admin` dan `kasir`.

### Bug/Risiko Tersisa yang Perlu Migration atau Refactor Lebih Besar

- Schema utama database sebelumnya belum final: beberapa controller memakai kolom yang hanya ada di migration terpisah, misalnya `products.is_active`, `customers.barcode_code`, `transactions.total_gallons`, `transactions.voucher_*`, dan `transactions.delete_requested`. Sudah dibuat patch final di `backend/src/models/final_schema_patch.sql`; jalankan file ini di Supabase SQL Editor.
- Inventory sebelumnya belum konsisten: schema utama memakai `current_stock`, tetapi controller memakai `current` dan `type`. Controller inventory sekarang kompatibel dengan kedua versi, dan migration final menambahkan kolom yang diperlukan.
- Otomatisasi pengurangan stok transaksi sebelumnya hardcoded ke inventory id `1`, `3`, dan `4`. Sekarang deduction mencari item berdasarkan nama seperti `tutup`, `tisu/tissue`, dan `tandon/air` pada cabang transaksi.
- CORS backend sebelumnya terlalu permisif (`origin: '*'`). Sekarang CORS memakai `ALLOWED_ORIGINS` dengan default lokal.
- Face attendance belum benar-benar melakukan face matching; saat ini masih upload foto/check-in berbasis foto.
- Route `/transactions/all-deliveries` masih ada untuk kebutuhan admin/operasional, dan sekarang dibatasi untuk `admin`, `branch_admin`, dan `superadmin`.
- Build frontend masih memberi warning chunk vendor besar; perlu lazy-loading halaman berat.

### Migration Wajib

Jalankan file berikut di Supabase SQL Editor setelah base schema:

`backend/src/models/final_schema_patch.sql`

### Audit Tambahan Setelah Migration

- Transaksi POS sekarang menyimpan `user_id`, sehingga rekap shift kasir dapat menghitung penjualan dalam shift.
- Active shift sekarang menghitung `total_sales` dan `total_transactions` secara live dari transaksi user sejak shift dibuka.
- Close shift dibuat toleran jika kolom `total_sales`/`total_transactions` belum ada, tetapi migration final tetap menambahkan kolom tersebut.
- Procurement diperbaiki agar PO memakai field `items_description` tetapi frontend tetap menerima alias `items`.
- Supplier diperbaiki agar frontend menerima alias `contact` dan `terms` dari kolom database `contact_name` dan `payment_terms_days`.
- Query purchase order tidak lagi bergantung pada kolom `ordered_at`; migration final tetap menambahkan `ordered_at` untuk kompatibilitas.
