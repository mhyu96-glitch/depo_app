require('dotenv').config();
const axios = require('axios');

// Test login dengan user yang ada
const testLogin = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  const testUsers = [
    { username: 'admin', password: 'admin123', name: 'Super Admin' },
    { username: 'MAKIN', password: 'makin123', name: 'MAKIN' },
    { username: 'andi', password: 'andi123', name: 'andi' },
  ];

  console.log('=== TESTING LOGIN FLOW ===\n');

  for (const testUser of testUsers) {
    try {
      console.log(`Testing login for: ${testUser.name} (${testUser.username})`);
      
      const res = await axios.post(`${baseURL}/auth/login`, {
        username: testUser.username,
        password: testUser.password,
        branch: '' // Kosongkan branch - otomatis dari database
      });

      console.log('✅ Login berhasil!');
      console.log('  User:', res.data.data.user.name);
      console.log('  Role:', res.data.data.user.role);
      console.log('  Branch:', res.data.data.user.branch_name || 'NOT ASSIGNED');
      console.log('  Token:', res.data.data.token.substring(0, 20) + '...');
      console.log('');
    } catch (error) {
      console.log('❌ Login gagal!');
      console.log('  Error:', error.response?.data?.message || error.message);
      console.log('');
    }
  }
};

testLogin();
