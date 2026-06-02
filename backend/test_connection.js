require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const now = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log('✅ Supabase Connected!');
    console.log('Time:', now.rows[0].time);
    console.log('Database:', now.rows[0].db);

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('\n📋 Tables in database:');
    tables.rows.forEach(t => console.log('  -', t.table_name));

    const branches = await pool.query('SELECT COUNT(*) as count FROM branches');
    console.log('\n🏢 Branches count:', branches.rows[0].count);

    const transactions = await pool.query('SELECT COUNT(*) as count FROM transactions');
    console.log('💰 Transactions count:', transactions.rows[0].count);

    const customers = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log('👥 Customers count:', customers.rows[0].count);

    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('👤 Users count:', users.rows[0].count);

    const products = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('📦 Products count:', products.rows[0].count);

    console.log('\n🎉 All tests passed! Database is fully connected.');
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
