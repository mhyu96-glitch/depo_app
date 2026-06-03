const axios = require('axios');

async function testSimple() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  try {
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'ANO',
      password: 'ano123'
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.data?.token) {
      const token = loginResponse.data.data.token;
      console.log('Token received:', token.substring(0, 20) + '...');
      
      // Test simple transaction without voucher first
      console.log('\nTesting simple transaction...');
      const simpleTransaction = {
        customer_name: 'Test Customer',
        transaction_type: 'pickup',
        total_gallons: 1,
        subtotal: 5000,
        total_amount: 5000,
        payment_method: 'cash',
        payment_status: 'paid',
        branch_id: 15, // ANO is in branch 15
        items: [{
          product_id: 1,
          product_name: 'Galon Air',
          quantity: 1,
          unit_price: 5000,
          total_price: 5000
        }]
      };
      
      const headers = { Authorization: `Bearer ${token}` };
      const txResponse = await axios.post(`${API_URL}/transactions`, simpleTransaction, { headers });
      console.log('Transaction success:', txResponse.data);
      
    } else {
      console.log('Login failed - no token received');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSimple();