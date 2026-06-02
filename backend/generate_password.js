const bcrypt = require('bcryptjs');

// Generate password hash untuk testing
const passwords = [
  { user: 'ANO', password: 'ano123' },
  { user: 'ANO', password: 'ANO123' },
  { user: 'ANO', password: '123456' },
  { user: 'MAKIN', password: 'makin123' },
  { user: 'HAMDAN', password: 'hamdan123' },
];

console.log('=== PASSWORD HASH GENERATOR ===\n');

passwords.forEach(item => {
  const hash = bcrypt.hashSync(item.password, 10);
  console.log(`User: ${item.user}`);
  console.log(`Password: ${item.password}`);
  console.log(`Hash: ${hash}`);
  console.log('');
});

console.log('Copy hash yang sesuai dan update di database dengan query:');
console.log("UPDATE users SET password = 'HASH_HERE' WHERE username = 'USERNAME_HERE';");
