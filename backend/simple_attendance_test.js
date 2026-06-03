const axios = require('axios');

async function simpleAttendanceTest() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  try {
    // Login first
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'ANO',
      password: 'ano123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login successful\n');
    
    // Try to get today's attendance (this should work if table exists)
    console.log('📅 Testing get today attendance...');
    const todayResponse = await axios.get(`${API_URL}/attendance/today`, { headers });
    console.log('✅ Today attendance endpoint works');
    console.log('Data:', todayResponse.data.data.length, 'records\n');
    
    // Try simple attendance create with minimal data
    console.log('📝 Testing simple attendance create...');
    const simplePayload = {
      courier_id: 1, // Simple ID
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/attendance/face`, simplePayload, { headers });
      console.log('✅ Simple attendance create successful');
      console.log('Response:', createResponse.data);
    } catch (createError) {
      console.log('❌ Create failed:', createError.response?.data?.message || createError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

simpleAttendanceTest();