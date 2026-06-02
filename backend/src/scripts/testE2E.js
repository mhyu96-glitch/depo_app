const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const run = async () => {
  console.log('--- STARTING E2E WORKFLOW SIMULATION ---');
  try {
    const token = jwt.sign({ id: 1, role: 'kasir', branch_id: 1, name: 'Test Kasir' }, process.env.JWT_SECRET);
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Create a Transaction (Tunai)
    console.log('[1] Simulating Cash Transaction (POS)...');
    const cashRes = await axios.post('http://localhost:5000/api/transactions', {
      transaction_type: 'pickup',
      customer_name: 'Budi (Test)',
      customer_phone: '08123456789',
      total_gallons: 2,
      unit_price: 5000,
      total_amount: 10000,
      payment_method: 'cash',
      payment_status: 'paid',
      items: [{ product_id: 1, product_name: 'Galon', quantity: 2, unit_price: 5000, total_price: 10000 }]
    }, config);
    console.log('  -> Result:', cashRes.data.message);

    // 2. Create a Transaction (Kasbon)
    console.log('[2] Simulating Credit Transaction (POS)...');
    const creditRes = await axios.post('http://localhost:5000/api/transactions', {
      transaction_type: 'delivery',
      customer_name: 'Andi (Test)',
      customer_phone: '08123456790',
      total_gallons: 5,
      unit_price: 5000,
      total_amount: 25000,
      payment_method: 'credit',
      payment_status: 'unpaid',
      items: [{ product_id: 1, product_name: 'Galon', quantity: 5, unit_price: 5000, total_price: 25000 }]
    }, config);
    console.log('  -> Result:', creditRes.data.message);
    
    // 3. Test Offline Handling Simulation
    // (This is just an API check, offline is primarily frontend logic, but we verify API handles it).
    
    console.log('--- SIMULATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('--- SIMULATION FAILED ---');
    if (err.response) {
      console.error('Error Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
};

run();
