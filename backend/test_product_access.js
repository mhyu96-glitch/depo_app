const axios = require('axios');

async function testProductAccess() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  try {
    console.log('🧪 Testing Product Access for Branch Admin...\n');
    
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
    
    // 2. Test Get Products
    console.log('2️⃣ Testing get products...');
    const productsResponse = await axios.get(`${API_URL}/products`, { headers });
    console.log('✅ Products fetched successfully');
    console.log(`📦 Found ${productsResponse.data.data.length} products for branch ${user.branch_name}\n`);
    
    if (productsResponse.data.data.length > 0) {
      productsResponse.data.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - Rp ${product.price?.toLocaleString('id-ID')} (Branch: ${product.branch_name || 'Global'})`);
      });
      console.log();
    }
    
    // 3. Test Create Product
    console.log('3️⃣ Testing create product...');
    const newProduct = {
      name: `Test Product ${Date.now()}`,
      price: 10000,
      branch_id: user.branch_id
    };
    
    const createResponse = await axios.post(`${API_URL}/products`, newProduct, { headers });
    console.log('✅ Product created successfully');
    console.log(`📦 Created: ${createResponse.data.data.name} - Rp ${createResponse.data.data.price?.toLocaleString('id-ID')}\n`);
    
    // 4. Test Update Product (use the first product if exists)
    if (productsResponse.data.data.length > 0) {
      const productToUpdate = productsResponse.data.data[0];
      console.log(`4️⃣ Testing update product: ${productToUpdate.name}...`);
      
      const updateData = {
        name: productToUpdate.name,
        price: productToUpdate.price + 1000, // Increase price by 1000
        is_active: true
      };
      
      const updateResponse = await axios.put(`${API_URL}/products/${productToUpdate.id}`, updateData, { headers });
      console.log('✅ Product updated successfully');
      console.log(`📦 Updated: ${productToUpdate.name} - New price: Rp ${updateData.price.toLocaleString('id-ID')}\n`);
    }
    
    console.log('🎉 All product access tests passed for branch admin!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
}

testProductAccess();