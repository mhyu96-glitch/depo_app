const { Client } = require('pg');
require('dotenv').config();

const seed = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL tidak ditemukan di file .env');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  console.log('🚀 Menghubungkan ke PostgreSQL/Supabase untuk memasukkan data dummy...');

  try {
    await client.connect();
    console.log('✅ Terhubung.');

    console.log('⏳ Membersihkan data lama...');
    // Delete in correct dependency order
    await client.query('DELETE FROM transaction_items CASCADE;');
    await client.query('DELETE FROM transactions CASCADE;');
    await client.query('DELETE FROM customers CASCADE;');
    await client.query('DELETE FROM couriers CASCADE;');
    await client.query('DELETE FROM products CASCADE;');
    await client.query('DELETE FROM users CASCADE;');
    await client.query('DELETE FROM branches CASCADE;');

    console.log('✅ Data lama dibersihkan.');

    console.log('⏳ Memasukkan data cabang (branches)...');
    await client.query(`
      INSERT INTO branches (id, name, code, address, phone, whatsapp, is_active) VALUES
      (1, 'Depo Pusat', 'PST', 'Jl. Utama No. 1, Samarinda', '08123456789', '08123456789', true),
      (2, 'Cabang Melati', 'MLT', 'Jl. Melati No. 5, Samarinda', '08198765432', '08198765432', true);
    `);

    console.log('⏳ Memasukkan data pengguna (users)...');
    // Admin: password = 'admin123'
    // Kasir: password = 'kasir123'
    await client.query(`
      INSERT INTO users (id, branch_id, name, username, password, role, is_active) VALUES
      (1, 1, 'Super Admin', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true),
      (2, 1, 'Kasir Demo', 'kasir', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir', true);
    `);

    console.log('⏳ Memasukkan data produk (products)...');
    await client.query(`
      INSERT INTO products (id, branch_id, name, price) VALUES
      (1, 1, 'Galon Isi Ulang', 5000),
      (2, 1, 'Galon Baru + Isi', 50000),
      (3, 1, 'Tutup Galon', 2000);
    `);

    console.log('⏳ Memasukkan data kurir (couriers)...');
    await client.query(`
      INSERT INTO couriers (id, branch_id, name, phone, base_salary, is_active) VALUES
      (1, 1, 'Rian Hidayat', '08123456781', 1500000, true),
      (2, 1, 'Budi Kurniawan', '08123456782', 1500000, true);
    `);

    console.log('⏳ Memasukkan data pelanggan (customers)...');
    await client.query(`
      INSERT INTO customers (id, branch_id, name, whatsapp, address, house_number, block_name, voucher_code, loyalty_count, total_free_gallon, tier) VALUES
      (1, 1, 'Budi Santoso', '08123456789', 'Jl. Melati No. 12, Samarinda', '12', 'Melati', 'VOUCH-BUDI', 15, 1, 'Premium Member'),
      (2, 1, 'Siti Aminah', '08198765432', 'Jl. Mawar No. 3, Samarinda', '3', 'Mawar', 'VOUCH-SITI', 7, 0, 'Silver'),
      (3, 1, 'Agus Prayitno', '08156789012', 'Jl. Cempaka No. 7, Samarinda', '7', 'Cempaka', 'VOUCH-AGUS', 12, 1, 'Silver');
    `);

    console.log('⏳ Memasukkan data transaksi pengiriman (transactions)...');
    await client.query(`
      INSERT INTO transactions (
        id, branch_id, customer_id, courier_id, user_id, invoice_number, 
        transaction_type, delivery_status, priority, lat, lng, 
        subtotal, discount, total_amount, payment_method, payment_status, 
        commission_amount, total_gallons, notes
      ) VALUES
      (101, 1, 1, 1, 2, 'INV-2026-001', 'delivery', 'on_way', 'express', -0.5021, 117.1536, 25000, 0, 25000, 'cod', 'unpaid', 2500, 5, 'Kirim cepat, air untuk kantor'),
      (102, 1, 2, null, 2, 'INV-2026-002', 'delivery', 'pending', 'normal', -0.5050, 117.1580, 15000, 0, 15000, 'cash', 'paid', 1500, 3, 'Tukar galon kosong di teras'),
      (103, 1, 3, null, 2, 'INV-2026-003', 'delivery', 'pending', 'normal', -0.5080, 117.1510, 30000, 0, 30000, 'cod', 'unpaid', 3000, 6, 'Bayar pas dengan uang cash');
    `);

    console.log('⏳ Memasukkan detail item transaksi (transaction_items)...');
    await client.query(`
      INSERT INTO transaction_items (id, transaction_id, product_id, product_name, quantity, unit_price, total_price) VALUES
      (1, 101, 1, 'Galon Isi Ulang', 5, 5000, 25000),
      (2, 102, 1, 'Galon Isi Ulang', 3, 5000, 15000),
      (3, 103, 1, 'Galon Isi Ulang', 6, 5000, 30000);
    `);

    // Reset sequence generators for serial keys
    await client.query("SELECT setval('branches_id_seq', (SELECT MAX(id) FROM branches));");
    await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
    await client.query("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));");
    await client.query("SELECT setval('couriers_id_seq', (SELECT MAX(id) FROM couriers));");
    await client.query("SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));");
    await client.query("SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));");
    await client.query("SELECT setval('transaction_items_id_seq', (SELECT MAX(id) FROM transaction_items));");

    console.log('✅ Data dummy berhasil dimasukkan ke PostgreSQL/Supabase.');
    console.log('✨ Simulator Depo sekarang memiliki data riil untuk diuji.');
  } catch (err) {
    console.error('❌ Gagal memasukkan data dummy:', err.message);
  } finally {
    await client.end();
  }
};

seed();
