const bcrypt = require('bcryptjs');

// Generate password hash untuk SEMUA user
const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'kasir', password: 'kasir123' },
  { username: 'andi', password: 'andi123' },
  { username: 'superadmin', password: 'superadmin123' },
  { username: 'MAKIN', password: 'makin123' },
  { username: 'ANO', password: 'ano123' },
  { username: 'HAMDAN', password: 'hamdan123' },
  { username: 'SAID', password: 'said123' },
];

console.log('=== GENERATING PASSWORD HASHES FOR ALL USERS ===\n');
console.log('Copy SQL queries dibawah ini dan jalankan di Supabase SQL Editor:\n');
console.log('-- Reset password untuk semua user');
console.log('-- Password format: [username]123 (lowercase)\n');

users.forEach(user => {
  const hash = bcrypt.hashSync(user.password, 10);
  console.log(`-- User: ${user.username} | Password: ${user.password}`);
  console.log(`UPDATE users SET password = '${hash}' WHERE username = '${user.username}';`);
  console.log('');
});

console.log('\n-- Verify semua user');
console.log('SELECT username, role, branch_id, is_active FROM users ORDER BY id;');

console.log('\n=== CREDENTIALS UNTUK LOGIN ===');
users.forEach(user => {
  console.log(`Username: ${user.username.padEnd(15)} | Password: ${user.password}`);
});
