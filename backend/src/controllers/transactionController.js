const db = require('../config/database');
const auditController = require('./auditController');

exports.getAll = async (req, res) => {
  try {
    const { branch_id, start_date, end_date, has_voucher, voucher_type, voucher_code } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    if (start_date && end_date) {
      params.push(start_date, end_date);
      query += ` AND created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    if (has_voucher === 'true') {
      query += ` AND voucher_code IS NOT NULL AND voucher_code != ''`;
    }
    if (voucher_type) {
      params.push(voucher_type);
      query += ` AND voucher_type = $${params.length}`;
    }
    if (voucher_code) {
      params.push(`%${voucher_code}%`);
      query += ` AND voucher_code ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const transaction = await db.pool.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (transaction.rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    const items = await db.pool.query('SELECT * FROM transaction_items WHERE transaction_id = $1', [req.params.id]);
    res.json({ data: { ...transaction.rows[0], items: items.rows } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  const { 
    customer_id, customer_name, transaction_type, courier_id, 
    subtotal, discount, total_amount, payment_method, payment_status, 
    notes, branch_id, commission_amount, items, total_gallons,
    priority, lat, lng, voucher_code, voucher_discount, voucher_type
  } = req.body;
  const invoice_number = 'INV-' + Date.now();

  let client;
  try {
    client = await db.getConnection();
    await client.query('BEGIN');
    
    const delivery_status = transaction_type === 'delivery' ? 'pending' : null;
    const result = await client.query(
      `INSERT INTO transactions (
        invoice_number, customer_id, customer_name, transaction_type, 
        courier_id, subtotal, discount, total_amount, payment_method, 
        payment_status, notes, branch_id, commission_amount, 
        total_gallons, delivery_status, priority, lat, lng,
        voucher_code, voucher_discount, voucher_type
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [
        invoice_number, customer_id || null, customer_name, transaction_type, 
        courier_id || null, subtotal, discount, total_amount, payment_method, 
        payment_status, notes, branch_id, commission_amount, 
        total_gallons || 0, delivery_status, priority || 'normal', lat || null, lng || null,
        voucher_code || null, voucher_discount || 0, voucher_type || null
      ]
    );
    const transactionId = result.rows[0].id;

    for (const item of items) {
      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
        [transactionId, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
      );
    }

    if (customer_id) {
      await client.query('UPDATE customers SET loyalty_count = loyalty_count + 1 WHERE id = $1', [customer_id]);
    }

    // ==========================================
    // AUTOMATION 1: INVENTORY DEDUCTION
    // ==========================================
    if (total_gallons > 0) {
      // Deduct Tutup Galon (id 3)
      await client.query(
        `UPDATE inventory SET current = current - $1 WHERE id = 3 AND branch_id = $2`,
        [total_gallons, branch_id || 1]
      );
      // Deduct Tisu Galon (id 4)
      await client.query(
        `UPDATE inventory SET current = current - $1 WHERE id = 4 AND branch_id = $2`,
        [total_gallons, branch_id || 1]
      );
      // Deduct Tandon Air (id 1) by total_gallons * 19 Liters
      await client.query(
        `UPDATE inventory SET current = current - $1 WHERE id = 1 AND branch_id = $2`,
        [total_gallons * 19, branch_id || 1]
      );
    }

    // ==========================================
    // AUTOMATION 2: CASHFLOW (If Tunai)
    // ==========================================
    if (payment_method === 'cash') {
      await client.query(
        `INSERT INTO cash_flow (branch_id, type, category, description, amount, date) VALUES ($1, 'income', 'Penjualan POS', $2, $3, CURRENT_DATE)`,
        [branch_id || 1, `Penjualan ${invoice_number}`, total_amount]
      );
    }

    await client.query('COMMIT');
    
    // Log the transaction
    await auditController.log(
      req.user?.name || 'Kasir (System)', 
      'Create Transaction', 
      invoice_number, 
      `Total: ${total_amount}, Customer: ${customer_name || 'Umum'}`, 
      req.ip
    );

    // ==========================================
    // AUTOMATION 4: WHATSAPP NOTIFICATION
    // ==========================================
    if (customer_id) {
       const cust = await db.pool.query('SELECT whatsapp, name, loyalty_count FROM customers WHERE id=$1', [customer_id]);
       if(cust.rows.length && cust.rows[0].whatsapp) {
          const whatsappController = require('./whatsappController');
          whatsappController.sendWhatsApp(
            cust.rows[0].whatsapp, 
            whatsappController.TEMPLATES.receipt({
              customer_name: cust.rows[0].name,
              invoice_number,
              item: `${total_gallons}x Galon Air`,
              total_amount,
              payment_method,
              is_free_gallon: cust.rows[0].loyalty_count % 10 === 0
            }), 
            customer_id, 
            'receipt'
          );
       }
    }

    res.json({ message: 'Transaksi berhasil disimpan', data: result.rows[0] });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error', error: err.message });
  } finally {
    if (client && client.release) client.release();
  }
};

exports.getDeliveries = async (req, res) => {
  const courierId = req.params.courierId;
  try {
    const result = await db.pool.query(
      `SELECT t.*, c.name as customer_name, c.whatsapp as customer_phone, c.block_name, c.house_number, c.address as address
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.courier_id = $1 AND t.transaction_type = 'delivery'
       ORDER BY t.created_at DESC`,
      [courierId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getAllDeliveries = async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT t.*, c.name as customer_name, c.whatsapp as customer_phone, c.block_name, c.house_number, c.address as address,
              co.name as taken_by_name
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN couriers co ON t.courier_id = co.id
       WHERE t.transaction_type = 'delivery' AND (t.delivery_status != 'delivered' OR t.delivery_status IS NULL)
       ORDER BY t.created_at DESC`
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.claimTask = async (req, res) => {
  const { id } = req.params;
  const { courier_id } = req.body;
  try {
    // Check if already claimed
    const check = await db.pool.query('SELECT courier_id FROM transactions WHERE id = $1', [id]);
    if (check.rows.length > 0 && check.rows[0].courier_id) {
      return res.status(400).json({ message: 'Tugas sudah diambil oleh kurir lain' });
    }

    await db.pool.query(
      'UPDATE transactions SET courier_id = $1, delivery_status = $2 WHERE id = $3',
      [courier_id, 'on_way', id]
    );
    res.json({ message: 'Tugas berhasil diambil' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.pool.query('UPDATE transactions SET delivery_status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Status pengiriman berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
