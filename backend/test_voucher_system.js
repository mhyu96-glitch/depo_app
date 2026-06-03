const axios = require('axios');

// Test Voucher System
async function testVoucherSystem() {
  const API_URL = 'https://depo-air-minum-api-production.up.railway.app/api';
  
  console.log('🧪 Testing Voucher System...\n');
  
  try {
    // 1. Test Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'ANO',
      password: 'ano123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful\n');
    
    // 2. Test Transaction with Auto-Generated BL Voucher
    console.log('2️⃣ Testing transaction with BL auto-voucher...');
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
    const blVoucherCode = `BL${dateStr}${timeStr}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    const blTransaction = {
      customer_name: 'Test Customer BL',
      transaction_type: 'pickup',
      total_gallons: 2,
      subtotal: 10000,
      total_amount: 8000, // 10000 - 2000 discount
      payment_method: 'cash',
      payment_status: 'paid',
      branch_id: 1,
      items: [{
        product_id: 1,
        product_name: 'Galon Air',
        quantity: 2,
        unit_price: 5000,
        total_price: 10000
      }],
      voucher_code: blVoucherCode,
      voucher_discount: 2000,
      voucher_type: 'BL'
    };
    
    const blResponse = await axios.post(`${API_URL}/transactions`, blTransaction, { headers });
    console.log('✅ BL Transaction created:', blResponse.data.data.invoice_number);
    console.log('📍 Voucher Code:', blVoucherCode, '| Discount: Rp 2,000\n');
    
    // 3. Test Transaction with Auto-Generated DL Voucher
    console.log('3️⃣ Testing transaction with DL auto-voucher...');
    const dlVoucherCode = `DL${dateStr}${timeStr}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    const dlTransaction = {
      customer_name: 'Test Customer DL',
      transaction_type: 'delivery',
      courier_id: 1,
      total_gallons: 1,
      subtotal: 5000,
      total_amount: 4000, // 5000 - 1000 discount
      payment_method: 'cash',
      payment_status: 'paid',
      branch_id: 1,
      items: [{
        product_id: 1,
        product_name: 'Galon Air',
        quantity: 1,
        unit_price: 5000,
        total_price: 5000
      }],
      voucher_code: dlVoucherCode,
      voucher_discount: 1000,
      voucher_type: 'DL'
    };
    
    const dlResponse = await axios.post(`${API_URL}/transactions`, dlTransaction, { headers });
    console.log('✅ DL Transaction created:', dlResponse.data.data.invoice_number);
    console.log('📍 Voucher Code:', dlVoucherCode, '| Discount: Rp 1,000\n');
    
    // 4. Test Manual Voucher Transaction
    console.log('4️⃣ Testing transaction with manual voucher...');
    const manualTransaction = {
      customer_name: 'Test Customer Manual',
      transaction_type: 'pickup',
      total_gallons: 5,
      subtotal: 25000,
      total_amount: 22500, // 25000 - 2500 discount
      payment_method: 'cash',
      payment_status: 'paid',
      branch_id: 1,
      items: [{
        product_id: 1,
        product_name: 'Galon Air',
        quantity: 5,
        unit_price: 5000,
        total_price: 25000
      }],
      voucher_code: 'DISKON10',
      voucher_discount: 2500,
      voucher_type: 'manual'
    };
    
    const manualResponse = await axios.post(`${API_URL}/transactions`, manualTransaction, { headers });
    console.log('✅ Manual Transaction created:', manualResponse.data.data.invoice_number);
    console.log('📍 Voucher Code: DISKON10 | Discount: Rp 2,500\n');
    
    // 5. Test Voucher Report Query
    console.log('5️⃣ Testing voucher report query...');
    const today_date = new Date().toISOString().split('T')[0];
    const reportResponse = await axios.get(`${API_URL}/transactions`, { 
      headers,
      params: {
        start_date: today_date,
        end_date: today_date,
        has_voucher: 'true',
        branch_id: 1
      }
    });
    
    const voucherTransactions = reportResponse.data.data || [];
    console.log(`✅ Voucher report: Found ${voucherTransactions.length} transactions with vouchers today`);
    
    if (voucherTransactions.length > 0) {
      console.log('📊 Summary:');
      let totalBL = 0, totalDL = 0, totalManual = 0;
      let discountBL = 0, discountDL = 0, discountManual = 0;
      
      voucherTransactions.forEach(tx => {
        if (tx.voucher_type === 'BL') {
          totalBL++;
          discountBL += parseFloat(tx.voucher_discount || 0);
        } else if (tx.voucher_type === 'DL') {
          totalDL++;
          discountDL += parseFloat(tx.voucher_discount || 0);
        } else {
          totalManual++;
          discountManual += parseFloat(tx.voucher_discount || 0);
        }
      });
      
      console.log(`   🛒 BL (Beli Langsung): ${totalBL} vouchers, Rp ${discountBL.toLocaleString('id-ID')} discount`);
      console.log(`   🚚 DL (Delivery): ${totalDL} vouchers, Rp ${discountDL.toLocaleString('id-ID')} discount`);
      console.log(`   📝 Manual: ${totalManual} vouchers, Rp ${discountManual.toLocaleString('id-ID')} discount`);
      console.log(`   💰 Total Discount: Rp ${(discountBL + discountDL + discountManual).toLocaleString('id-ID')}`);
    }
    
    console.log('\n🎉 Voucher system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500 && error.response?.data?.error?.includes('column')) {
      console.log('\n💡 Note: Database may need migration to add voucher columns.');
      console.log('   Run: ALTER TABLE transactions ADD COLUMN voucher_code VARCHAR(50);');
      console.log('        ALTER TABLE transactions ADD COLUMN voucher_discount DECIMAL(10,2) DEFAULT 0;');
      console.log('        ALTER TABLE transactions ADD COLUMN voucher_type VARCHAR(20);');
    }
  }
}

// Run test
testVoucherSystem();