const bcrypt = require('bcryptjs');

// Password hash dari database untuk user ANO
const hashFromDB = '$2a$10$gnyYtl$0hmaeWd0aBNQ4.4emq1B.NRxeDnUyUjQqEbCpCwxvgV.c';

// Kemungkinan password yang digunakan
const possiblePasswords = [
  'ANO',
  'ano',
  'ANO123',
  'ano123',
  'Ano123',
  '123456',
  'password',
  'ano@123',
  'ANO@123',
];

console.log('=== TESTING PASSWORDS FOR USER ANO ===\n');
console.log('Hash from DB:', hashFromDB);
console.log('\nTesting possible passwords...\n');

possiblePasswords.forEach(password => {
  const isMatch = bcrypt.compareSync(password, hashFromDB);
  if (isMatch) {
    console.log(`✅ MATCH FOUND! Password: "${password}"`);
  } else {
    console.log(`❌ "${password}" - tidak match`);
  }
});

console.log('\n=== GENERATING NEW HASH ===');
console.log('Jika semua password di atas gagal, gunakan hash baru ini:\n');

const newPassword = 'ano123';
const newHash = bcrypt.hashSync(newPassword, 10);
console.log(`Password baru: ${newPassword}`);
console.log(`Hash baru: ${newHash}`);
console.log('\nJalankan query ini di Supabase:');
console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'ANO';`);
