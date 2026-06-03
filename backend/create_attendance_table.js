const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Clean the connection string and add our SSL config
let connectionString = process.env.DATABASE_URL || 'postgresql://postgres.sxbzseesvyatezqlftis:mwahyu29121996@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

// Remove sslmode parameter if present
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');

console.log('🔗 Connecting to database...');

const pool = new Pool({
  connectionString: connectionString,
  ssl: { 
    rejectUnauthorized: false 
  }
});

async function setupAttendanceTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking attendance table...\n');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'attendance'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Attendance table does not exist. Creating...');
      
      // Create basic attendance table
      await client.query(`
        CREATE TABLE attendance (
          id SERIAL PRIMARY KEY,
          courier_id INTEGER NOT NULL,
          branch_id INTEGER,
          date DATE DEFAULT CURRENT_DATE,
          check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          check_out_time TIMESTAMP,
          face_data TEXT,
          face_verified BOOLEAN DEFAULT FALSE,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          device_info VARCHAR(255),
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Attendance table created successfully!');
      
      // Add indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_courier_date ON attendance(courier_id, date);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance(branch_id);');
      
      console.log('✅ Indexes added successfully!');
      
    } else {
      console.log('✅ Attendance table exists');
      
      // Check columns and add missing ones
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'attendance'
        ORDER BY ordinal_position
      `);
      
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      console.log('📋 Existing columns:', existingColumns);
      
      // Define required columns for face attendance
      const requiredColumns = {
        'id': 'SERIAL PRIMARY KEY',
        'courier_id': 'INTEGER NOT NULL',
        'branch_id': 'INTEGER',
        'date': 'DATE DEFAULT CURRENT_DATE',
        'check_in_time': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'check_out_time': 'TIMESTAMP',
        'face_data': 'TEXT',
        'face_verified': 'BOOLEAN DEFAULT FALSE',
        'location_lat': 'DECIMAL(10, 8)',
        'location_lng': 'DECIMAL(11, 8)',
        'device_info': 'VARCHAR(255)',
        'created_by': 'INTEGER',
        'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      };
      
      // Add missing columns
      for (const [column, definition] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(column) && column !== 'id') {
          try {
            await client.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS ${column} ${definition};`);
            console.log(`✅ Added column: ${column}`);
          } catch (err) {
            console.log(`⚠️  Could not add column ${column}:`, err.message);
          }
        }
      }
    }
    
    // Verify final structure
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'attendance'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final attendance table structure:');
    finalCheck.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🎉 Attendance table setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAttendanceTable();