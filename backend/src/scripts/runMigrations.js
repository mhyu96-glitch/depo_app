const db = require('../config/database');

const run = async () => {
  const client = await db.getConnection();
  try {
    console.log('Running migrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('tank', 'supply', 'product')),
        capacity INT,
        current_stock INT NOT NULL DEFAULT 0,
        unit VARCHAR(20) NOT NULL,
        min_stock INT DEFAULT 0,
        branch_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS inventory_logs (
        id SERIAL PRIMARY KEY,
        item_id INT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'usage')),
        qty INT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventories(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id SERIAL PRIMARY KEY,
        customer_id INT,
        phone VARCHAR(20) NOT NULL,
        message_type VARCHAR(50),
        message_body TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      );
    `);
    
    // Seed initial inventory if empty
    const check = await client.query('SELECT COUNT(*) FROM inventories');
    if (parseInt(check.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO inventories (name, type, capacity, current_stock, unit, min_stock, branch_id) VALUES
        ('Tandon Air Baku A', 'tank', 5000, 4200, 'Liter', 500, 1),
        ('Tutup Galon Biru', 'supply', NULL, 850, 'Pcs', 200, 1),
        ('Tisu Galon', 'supply', NULL, 1200, 'Pcs', 300, 1),
        ('Galon Kosong (Brand)', 'supply', NULL, 140, 'Unit', 50, 1);
      `);
      console.log('Seeded initial inventories');
    }

    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
};

run();
