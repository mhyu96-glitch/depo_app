const db = require('../config/database');
const auditController = require('./auditController');

const deductInventoryItem = async (client, branchId, namePatterns, amount, reason) => {
  if (!amount || amount <= 0) return;

  const columnsResult = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory'
  `);
  const columns = new Set(columnsResult.rows.map(row => row.column_name));
  const stockColumn = columns.has('current') ? 'current' : 'current_stock';

  const patternSql = namePatterns.map((_, idx) => `LOWER(name) LIKE $${idx + 2}`).join(' OR ');
  const itemResult = await client.query(
    `SELECT id FROM inventory
     WHERE branch_id = $1 AND (${patternSql})
     ORDER BY id ASC
     LIMIT 1`,
    [branchId, ...namePatterns.map(pattern => `%${pattern.toLowerCase()}%`)]
  );

  if (itemResult.rows.length === 0) return;

  const inventoryId = itemResult.rows[0].id;
  await client.query(
    `UPDATE inventory SET ${stockColumn} = GREATEST(${stockColumn} - $1, 0) WHERE id = $2`,
    [amount, inventoryId]
  );
  await client.query(
    'INSERT INTO inventory_logs (inventory_id, user_id, change_amount, reason) VALUES ($1, $2, $3, $4)',
    [inventoryId, null, -amount, reason]
  );
};

exports.getAll = async (req, res) => {
  try {
    let { branch_id, start_date, end_date, has_voucher, voucher_type, voucher_code } = req.query;
    
    // Branch filtering: branch_admin hanya lihat transaksi cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
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
    let query = 'SELECT * FROM transactions WHERE id = $1';
    const params = [req.params.id];
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      params.push(req.user.branch_id);
      query += ` AND branch_id = $${params.length}`;
    }

    const transaction = await db.pool.query(query, params);
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
        invoice_number, customer_id, customer_name, transaction_type, user_id,
        courier_id, subtotal, discount, total_amount, payment_method, 
        payment_status, notes, branch_id, commission_amount, 
        total_gallons, delivery_status, priority, lat, lng,
        voucher_code, voucher_discount, voucher_type
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
      [
        invoice_number, customer_id || null, customer_name, transaction_type, req.user?.id || null,
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
      const finalBranchId = branch_id || req.user?.branch_id || 1;
      await deductInventoryItem(client, finalBranchId, ['tutup'], total_gallons, `Auto deduction ${invoice_number}`);
      await deductInventoryItem(client, finalBranchId, ['tisu', 'tissue'], total_gallons, `Auto deduction ${invoice_number}`);
      await deductInventoryItem(client, finalBranchId, ['tandon', 'air baku', 'air'], total_gallons * 19, `Auto deduction ${invoice_number}`);
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
  const courierId = parseInt(req.params.courierId, 10);
  try {
    if (!courierId) {
      return res.status(400).json({ message: 'Courier ID tidak valid' });
    }

    if (req.user?.courier_id && req.user.courier_id !== courierId) {
      return res.status(403).json({ message: 'Kurir hanya dapat melihat tugas miliknya sendiri' });
    }

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
    const params = [];
    let branchFilter = '';
    if (req.user.role === 'branch_admin') {
      params.push(req.user.branch_id);
      branchFilter = ` AND t.branch_id = $${params.length}`;
    }

    const result = await db.pool.query(
      `SELECT t.*, c.name as customer_name, c.whatsapp as customer_phone, c.block_name, c.house_number, c.address as address,
              co.name as taken_by_name
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN couriers co ON t.courier_id = co.id
       WHERE t.transaction_type = 'delivery' AND (t.delivery_status != 'delivered' OR t.delivery_status IS NULL)
       ${branchFilter}
       ORDER BY t.created_at DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.claimTask = async (req, res) => {
  res.status(403).json({ 
    message: 'Kurir tidak dapat mengambil tugas sendiri. Tugas pengantaran harus dipilih oleh kasir.' 
  });
};

exports.updateDeliveryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const allowedStatuses = ['pending', 'on_way', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status pengiriman tidak valid' });
    }

    const transaction = await db.pool.query(
      'SELECT courier_id, transaction_type FROM transactions WHERE id = $1',
      [id]
    );
    if (transaction.rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    if (req.user?.courier_id && transaction.rows[0].courier_id !== req.user.courier_id) {
      return res.status(403).json({ message: 'Kurir hanya dapat mengubah status tugas miliknya' });
    }

    await db.pool.query('UPDATE transactions SET delivery_status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Status pengiriman berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.requestDelete = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    // Check if transaction exists and belongs to user's branch (for kasir/branch_admin)
    let checkQuery = 'SELECT * FROM transactions WHERE id = $1';
    const checkParams = [id];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      checkQuery += ' AND branch_id = $2';
      checkParams.push(req.user.branch_id);
    }
    
    const transaction = await db.pool.query(checkQuery, checkParams);
    if (transaction.rows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan atau bukan milik cabang Anda' });
    }

    // Check if already requested
    if (transaction.rows[0].delete_requested) {
      return res.status(400).json({ message: 'Permintaan penghapusan sudah pernah diajukan' });
    }

    // Mark as delete requested
    await db.pool.query(
      'UPDATE transactions SET delete_requested = true, delete_reason = $1, delete_requested_by = $2, delete_requested_at = NOW() WHERE id = $3',
      [reason || 'Delete request from kasir', req.user.id, id]
    );

    // Log audit trail
    await auditController.log(
      req.user?.username || req.user?.name || 'User', 
      'Request Delete Transaction', 
      transaction.rows[0].invoice_number, 
      `Reason: ${reason || 'Delete request from kasir'}`, 
      req.ip
    );

    // TODO: Send notification to admin (could be implemented later)
    // For now, admins can check via transaction list or dedicated approval page

    res.json({ 
      message: 'Permintaan penghapusan berhasil dikirim ke admin untuk approval',
      data: { transaction_id: id, status: 'pending_approval' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
