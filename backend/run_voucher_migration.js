const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Menggunakan koneksi langsung ke Supabase dengan SSL config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sxbzseesvyatezqlftis:mwahyu29121996@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runVoucherMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running voucher system migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'src/models/migration_voucher_system.sql'), 
      'utf8'
    );
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name LIKE '%voucher%'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Voucher columns created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runVoucherMigration();