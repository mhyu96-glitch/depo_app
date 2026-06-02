const { Pool } = require('pg');
const dns = require('dns');

const regions = [
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'sa-east-1'
];

const projectRef = 'zekckfnlzkvybfacnqsb';
const password = 'M.hyu29121996%40';

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  
  // First check DNS
  try {
    const addresses = await dns.promises.resolve4(host);
    console.log(`✅ ${region}: DNS OK (${addresses[0]})`);
  } catch (e) {
    console.log(`❌ ${region}: DNS FAIL`);
    return;
  }
  
  // Try connecting
  const connStr = `postgresql://postgres.${projectRef}:${password}@${host}:6543/postgres`;
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  
  try {
    const res = await pool.query('SELECT 1 as test');
    console.log(`🎉 ${region}: CONNECTION SUCCESS!`);
    await pool.end();
    return true;
  } catch (e) {
    console.log(`   ${region}: Connection error: ${e.message.substring(0, 80)}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('🔍 Searching for correct Supabase pooler region...\n');
  for (const region of regions) {
    const success = await tryRegion(region);
    if (success) {
      console.log(`\n✨ FOUND! Use region: ${region}`);
      console.log(`Connection string: postgresql://postgres.${projectRef}:***@aws-0-${region}.pooler.supabase.com:6543/postgres`);
      process.exit(0);
    }
  }
  console.log('\n😢 No pooler region found for this project.');
}

main();
