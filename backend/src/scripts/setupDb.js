const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setup = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL tidak ditemukan di file .env');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  console.log('🚀 Menghubungkan ke PostgreSQL/Supabase...');

  try {
    await client.connect();
    console.log('✅ Terhubung.');

    // Read Schema SQL
    const schemaPath = path.join(__dirname, '..', 'models', 'supabase_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Menjalankan skema database (Supabase)...');
    
    // Postgres can execute multiple queries in one call with client.query(text)
    await client.query(schemaSql);

    console.log('✅ Skema database berhasil diinisialisasi.');
    console.log('✨ Database Supabase siap digunakan!');
  } catch (err) {
    console.error('❌ Gagal menyiapkan database:', err.message);
  } finally {
    await client.end();
  }
};

setup();
