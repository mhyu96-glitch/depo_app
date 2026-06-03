const axios = require('axios');

async function testRollingAndFace() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  try {
    console.log('🧪 Testing Rolling Kasir & Face Attendance for Branch Admin...\n');
    
    // 1. Test Login
    console.log('1️⃣ Testing login for ANO (branch_admin)...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'ANO',
      password: 'ano123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login successful');
    console.log(`👤 User: ${user.name}, Role: ${user.role}, Branch: ${user.branch_name} (ID: ${user.branch_id})\n`);
    
    // 2. Test Get Users (untuk rolling)
    console.log('2️⃣ Testing get users for rolling access...');
    const usersResponse = await axios.get(`${API_URL}/users`, { headers });
    console.log('✅ Users fetched successfully');
    console.log(`👥 Found ${usersResponse.data.data.length} users visible to branch admin\n`);
    
    usersResponse.data.data.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.name} (${u.role}) - Branch: ${u.branch_name || 'Global'}`);
    });
    console.log();
    
    // 3. Test Face Attendance
    console.log('3️⃣ Testing face attendance...');
    
    // Create fake face data (base64 image)
    const fakeImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    const attendancePayload = {
      courier_id: user.id, // Use user.id as courier_id for testing
      face_data: fakeImageData,
      location_lat: -6.2088,  // Jakarta coordinates for testing
      location_lng: 106.8456,
      device_info: 'Test Browser Agent'
    };
    
    const attendanceResponse = await axios.post(`${API_URL}/attendance/face`, attendancePayload, { headers });
    console.log('✅ Face attendance successful');
    console.log(`📸 Message: ${attendanceResponse.data.message}`);
    
    if (attendanceResponse.data.data) {
      console.log(`📍 Attendance ID: ${attendanceResponse.data.data.id}`);
      console.log(`⏰ Check-in time: ${attendanceResponse.data.data.check_in_time || attendanceResponse.data.data.created_at}`);
    }
    console.log();
    
    // 4. Test Get Today's Attendance
    console.log('4️⃣ Testing get today attendance...');
    const todayAttendanceResponse = await axios.get(`${API_URL}/attendance/today`, { 
      headers,
      params: { branch_id: user.branch_id }
    });
    
    console.log('✅ Today attendance fetched successfully');
    console.log(`📅 Today's attendance count: ${todayAttendanceResponse.data.data.length}`);
    
    if (todayAttendanceResponse.data.data.length > 0) {
      todayAttendanceResponse.data.data.forEach((att, index) => {
        console.log(`   ${index + 1}. ${att.courier_name || 'Unknown'} - ${att.check_in_time || att.created_at}`);
      });
    }
    console.log();
    
    console.log('🎉 All tests passed! Branch admin can:');
    console.log('   ✅ Access rolling kasir features');
    console.log('   ✅ Submit face attendance');
    console.log('   ✅ View branch attendance data');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
}

testRollingAndFace();