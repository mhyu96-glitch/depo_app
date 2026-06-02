const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

// Handle pool errors to prevent app crash
pool.on('error', (err) => {
  console.error('🐘 Unexpected error on idle client', err);
});

console.log('🐘 PostgreSQL Pool initialized');

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (process.env.DEMO_MODE === 'true') {
      console.warn('⚠️ Database query failed in DEMO MODE. Returning empty result.');
      return { rows: [] };
    }
    throw err;
  }
};

module.exports = {
  pool,
  query,
  getConnection: async () => {
    try {
      return await pool.connect();
    } catch (err) {
      if (process.env.DEMO_MODE === 'true') {
        // Return a mock client that does nothing
        return {
          query: async () => ({ rows: [] }),
          release: () => {}
        };
      }
      throw err;
    }
  }
};
