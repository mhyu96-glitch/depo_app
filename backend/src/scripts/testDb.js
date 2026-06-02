const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:m.wahyu2912%40@db.zekckfnlzkvybfacnqsb.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => { console.log('Connected Successfully!'); client.end(); })
  .catch(e => console.error('Connection Failed:', e.message));
