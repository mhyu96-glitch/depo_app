const { Client } = require('pg');
require('dotenv').config();

const migrate = async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres@localhost:5432/postgres'
  });

  console.log('🚀 Menghubungkan ke PostgreSQL untuk migrasi tabel inventory...');

  try {
    await client.connect();
    console.log('✅ Terhubung.');

    // Alter table inventory to add columns
    console.log('⏳ Mengubah tabel inventory...');
    try {
      await client.query("ALTER TABLE inventory ADD COLUMN type VARCHAR(50) DEFAULT 'supply';");
      console.log('Added type column');
    } catch (e) {
      console.log('type column already exists or error:', e.message);
    }
    try {
      await client.query("ALTER TABLE inventory ADD COLUMN capacity INTEGER;");
      console.log('Added capacity column');
    } catch (e) {
      console.log('capacity column already exists or error:', e.message);
    }
    try {
      await client.query("ALTER TABLE inventory ADD COLUMN current INTEGER DEFAULT 0;");
      console.log('Added current column');
    } catch (e) {
      console.log('current column already exists or error:', e.message);
    }

    // Check if table is empty, and seed baseline inventory
    const countRes = await client.query('SELECT COUNT(*) FROM inventory;');
    const count = parseInt(countRes.rows[0].count);

    if (count === 0) {
      console.log('⏳ Memasukkan data inventory baseline...');
      await client.query(`
        INSERT INTO inventory (id, branch_id, name, type, capacity, current, unit, min_stock) VALUES
        (1, 1, 'Tandon Air Baku A', 'tank', 5000, 4200, 'Liter', 1000),
        (2, 1, 'Tandon Air Baku B', 'tank', 5000, 1500, 'Liter', 1000),
        (3, 1, 'Tutup Galon Biru', 'supply', null, 850, 'Pcs', 200),
        (4, 1, 'Tisu Galon', 'supply', null, 1200, 'Pcs', 300),
        (5, 1, 'Galon Kosong (Brand)', 'supply', null, 140, 'Unit', 50);
      `);
      await client.query("SELECT setval('inventory_id_seq', (SELECT MAX(id) FROM inventory));");
    }

    console.log('✅ Migrasi tabel inventory sukses.');
  } catch (err) {
    console.error('❌ Gagal melakukan migrasi inventory:', err.message);
  } finally {
    await client.end();
  }
};

migrate();
