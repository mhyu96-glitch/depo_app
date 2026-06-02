require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, 'src', 'models', 'schema_postgres.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to database...');
    await pool.query(sql);
    console.log('✅ Schema successfully executed on Supabase!');
  } catch (err) {
    console.error('❌ Error executing schema:', err.message);
  } finally {
    pool.end();
  }
}

runSchema();
