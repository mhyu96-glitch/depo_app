const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAttendanceSchema() {
  try {
    console.log('🔍 Checking attendance table schema...\n');
    
    // Get table columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'attendance'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No attendance table found or no columns');
      return;
    }
    
    console.log('📋 Attendance table columns:');
    result.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\n📊 Sample data:');
    const sampleResult = await pool.query('SELECT * FROM attendance LIMIT 3');
    
    if (sampleResult.rows.length > 0) {
      console.log('Found', sampleResult.rows.length, 'sample records:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}.`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('No data found in attendance table');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkAttendanceSchema();