const db = require('../config/database');

// Lookup customer by phone number (no auth required - public endpoint)
exports.lookup = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Nomor HP wajib diisi' });

  // Normalize phone (remove leading 0, add 62, etc.)
  const normalized = phone.replace(/^0/, '62').replace(/\D/g, '');

  try {
    const { rows } = await db.pool.query(
      `SELECT c.*, b.name as branch_name,
       (SELECT json_agg(t ORDER BY t.created_at DESC) FROM (
         SELECT id, invoice_number, total_amount, transaction_type, payment_status, created_at, delivery_status
         FROM transactions WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 10
       ) t) as transactions
       FROM customers c
       LEFT JOIN branches b ON c.branch_id = b.id
       WHERE c.whatsapp = $1 OR c.whatsapp = $2`,
      [phone, '0' + normalized.slice(2)]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Nomor HP tidak terdaftar.' });

    const customer = rows[0];
    const loyalty_target = 10;

    // Check for any active order (e.g. pending/on_way delivery transaction)
    let active_order = null;
    const activeOrderRes = await db.pool.query(
      `SELECT t.id, t.invoice_number, t.delivery_status, co.name as courier 
       FROM transactions t 
       LEFT JOIN couriers co ON t.courier_id = co.id
       WHERE t.customer_id = $1 AND t.transaction_type = 'delivery' AND t.delivery_status IN ('pending', 'on_way')
       ORDER BY t.created_at DESC LIMIT 1`,
      [customer.id]
    );

    if (activeOrderRes.rows.length) {
      const order = activeOrderRes.rows[0];
      active_order = {
        invoice: order.invoice_number,
        status: order.delivery_status,
        courier: order.courier || 'Sedang memproses...',
        eta: order.delivery_status === 'on_way' ? '15 menit' : 'Sedang bersiap'
      };
    }

    res.json({
      data: {
        ...customer,
        loyalty_target,
        loyalty_progress: Math.min(100, (customer.loyalty_count / loyalty_target) * 100),
        remaining_for_free: Math.max(0, loyalty_target - (customer.loyalty_count % loyalty_target)),
        is_eligible_free: customer.loyalty_count > 0 && customer.loyalty_count % loyalty_target === 0,
        active_order
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Place a new order request
exports.placeOrder = async (req, res) => {
  const { customer_id, phone, quantity, address, notes } = req.body;
  try {
    const invoice_number = 'INV-PORTAL-' + Date.now();
    const cust = await db.pool.query('SELECT name, branch_id FROM customers WHERE id = $1', [customer_id]);
    if (!cust.rows.length) return res.status(404).json({ message: 'Customer tidak ditemukan' });
    const customer_name = cust.rows[0].name;
    const branch_id = cust.rows[0].branch_id || 1;
    const total_amount = quantity * 5000;

    const result = await db.pool.query(
      `INSERT INTO transactions (
        invoice_number, customer_id, customer_name, transaction_type, 
        subtotal, discount, total_amount, payment_method, 
        payment_status, notes, branch_id, 
        total_gallons, delivery_status, priority
      ) 
       VALUES ($1, $2, $3, 'delivery', $4, 0, $5, 'cash', 'unpaid', $6, $7, $8, 'pending', 'normal') RETURNING *`,
      [
        invoice_number, customer_id, customer_name,
        total_amount, total_amount, notes || 'Order via Customer Portal', branch_id,
        quantity
      ]
    );

    res.json({ 
      data: { 
        status: 'pending', 
        message: `Pesanan ${quantity} galon berhasil dibuat! Antrean Anda sedang diproses.`,
        order: result.rows[0]
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Get store info for the portal landing page
exports.getStoreInfo = async (req, res) => {
  try {
    const { rows } = await db.pool.query('SELECT name FROM branches WHERE is_active=true');
    res.json({ 
      data: { 
        name: 'Depo', 
        tagline: 'Air Bersih Terpercaya untuk Keluarga Anda',
        phone: '08123456789',
        whatsapp: '08123456789',
        address: 'Jl. Utama No. 1',
        hours: 'Senin - Sabtu: 07.00 - 17.00',
        branches: rows.map(r => r.name), 
        price_per_gallon: 5000, 
        loyalty_target: 10 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};
