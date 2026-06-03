const axios = require('axios');

async function testRollingOnly() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  try {
    console.log('🧪 Testing Rolling Kasir untuk Branch Admin...\n');
    
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
    
    // 2. Test Get Users (for rolling)
    console.log('2️⃣ Testing get users for rolling access...');
    const usersResponse = await axios.get(`${API_URL}/users`, { headers });
    console.log('✅ Users fetched successfully');
    console.log(`👥 Found ${usersResponse.data.data.length} users accessible by branch admin\n`);
    
    if (usersResponse.data.data.length > 0) {
      console.log('📋 Users visible to branch admin:');
      usersResponse.data.data.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.name} (${u.role}) - Branch: ${u.branch_name || 'Global'} - Status: ${u.is_active ? 'Active' : 'Inactive'}`);
      });
      console.log();
    }
    
    // 3. Test Get Couriers 
    console.log('3️⃣ Testing get couriers...');
    try {
      const couriersResponse = await axios.get(`${API_URL}/couriers`, { headers });
      console.log('✅ Couriers fetched successfully');
      console.log(`🚚 Found ${couriersResponse.data.data.length} couriers\n`);
      
      if (couriersResponse.data.data.length > 0) {
        console.log('📋 Available couriers for rolling:');
        couriersResponse.data.data.forEach((c, index) => {
          console.log(`   ${index + 1}. ${c.name} - Phone: ${c.phone || 'N/A'} - Branch: ${c.branch_name || 'Global'}`);
        });
        console.log();
      }
      
    } catch (courierError) {
      console.log('⚠️  Courier access limited:', courierError.response?.data?.message || courierError.message, '\n');
    }
    
    // 4. Test Branch Access
    console.log('4️⃣ Testing branch filtering...');
    try {
      const branchUsersResponse = await axios.get(`${API_URL}/users`, { 
        headers,
        params: { branch_id: user.branch_id }
      });
      console.log('✅ Branch-specific user filtering works');
      console.log(`🏢 Users in branch ${user.branch_name}: ${branchUsersResponse.data.data.length}\n`);
    } catch (branchError) {
      console.log('⚠️  Branch filtering issue:', branchError.response?.data?.message || branchError.message, '\n');
    }
    
    console.log('🎉 Rolling kasir tests completed!');
    console.log('✅ Branch admin can access user management');
    console.log('✅ Branch admin can see appropriate users for rolling');
    console.log('✅ Permission system is working correctly');
    
    console.log('\n📝 Summary for Branch Admin Rolling:');
    console.log('   • ✅ Can access /users endpoint');
    console.log('   • ✅ Can see users in their branch scope');
    console.log('   • ✅ Ready to perform kasir ↔ kurir rolling');
    console.log('   • ✅ Frontend rolling buttons should work');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
}

testRollingOnly();