const { Client } = require('pg');
require('dotenv').config();

const resetDb = async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres@localhost:5432/postgres'
  });

  console.log('🚀 Menghubungkan ke PostgreSQL untuk membersihkan database dan menyetel ulang data baseline...');

  try {
    await client.connect();
    console.log('✅ Terhubung.');

    console.log('⏳ Membersihkan data lama...');
    // Delete in correct dependency order
    await client.query('TRUNCATE TABLE transaction_items, transactions, customers, couriers, attendance, cash_flow, expenses, fleet_maintenance, fleet_vehicles, asset_health, inventory_logs, inventory, audit_logs, iot_sensor_readings, whatsapp_logs, users, branches CASCADE;');

    console.log('✅ Semua tabel dibersihkan.');

    console.log('⏳ Memasukkan data cabang (branches) baseline...');
    await client.query(`
      INSERT INTO branches (id, name, code, address, phone, whatsapp, is_active) VALUES
      (1, 'Depo Pusat', 'PST', 'Jl. Utama No. 1, Samarinda', '08123456789', '08123456789', true),
      (2, 'Cabang Melati', 'MLT', 'Jl. Melati No. 5, Samarinda', '08198765432', '08198765432', true);
    `);

    console.log('⏳ Memasukkan data pengguna (users) baseline...');
    // Admin: password = 'admin123'
    // Kasir: password = 'kasir123'
    await client.query(`
      INSERT INTO users (id, branch_id, name, username, password, role, is_active) VALUES
      (1, 1, 'Super Admin', 'admin', '$2a$10$r/WGIyNpbMMqhS6Hyjde7O8pT1/EHF/EmNP2hdYAhuElJePIPpOqy', 'admin', true),
      (2, 1, 'Kasir Demo', 'kasir', '$2a$10$X4QSlMCUB1I/UTLrZEmF0eMe3KUelFixeYbSi5sDMekOqAXY9Omqy', 'kasir', true);
    `);

    console.log('⏳ Memasukkan data produk (products) baseline...');
    await client.query(`
      INSERT INTO products (id, branch_id, name, price) VALUES
      (1, 1, 'Galon Isi Ulang', 5000),
      (2, 1, 'Galon Baru + Isi', 50000),
      (3, 1, 'Tutup Galon', 2000);
    `);

    // Reset sequence generators for serial keys
    await client.query("SELECT setval('branches_id_seq', (SELECT MAX(id) FROM branches));");
    await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
    await client.query("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));");

    console.log('✅ Database bersih dari data dummy. Baseline data siap.');
  } catch (err) {
    console.error('❌ Gagal membersihkan database:', err.message);
  } finally {
    await client.end();
  }
};

resetDb();
