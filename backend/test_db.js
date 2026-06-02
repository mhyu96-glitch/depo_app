const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.zekckfnlzkvybfacnqsb:M.hyu29121996%40@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log('Connecting...');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
