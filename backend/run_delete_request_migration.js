const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

async function runDeleteRequestMigration() {
  try {
    console.log('🚀 Starting delete request columns migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'models', 'add_delete_request_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Delete request columns migration completed successfully!');
    console.log('');
    console.log('Added columns to transactions table:');
    console.log('  - delete_requested (BOOLEAN)');
    console.log('  - delete_reason (TEXT)');  
    console.log('  - delete_requested_by (INTEGER)');
    console.log('  - delete_requested_at (TIMESTAMP)');
    console.log('  - Added index for delete_requested queries');
    console.log('');
    console.log('✨ POS History with Delete Request system is now ready!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if columns already exist
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Delete request columns already exist in database.');
      console.log('✅ POS History system should work correctly.');
    }
  } finally {
    await pool.end();
  }
}

runDeleteRequestMigration();