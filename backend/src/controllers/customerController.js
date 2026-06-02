const db = require('../config/database');

const DUMMY_CUSTOMERS = [
  { id: 1, name: 'Budi Santoso', whatsapp: '081234567890', address: 'Jl. Merdeka No. 10', voucher_code: 'BUD01', loyalty_count: 12, branch_id: 1, created_at: '2026-01-01', tier: 'Gold', last_purchase: '2026-05-10' },
  { id: 2, name: 'Siti Aminah', whatsapp: '081234567891', address: 'Perum Indah Blok A/5', voucher_code: 'SIT02', loyalty_count: 85, branch_id: 1, created_at: '2026-01-02', tier: 'Platinum', last_purchase: '2026-05-12' },
  { id: 3, name: 'Agus Prayitno', whatsapp: '081234567892', address: 'Jl. Mawar No. 3', voucher_code: 'AGU03', loyalty_count: 25, branch_id: 1, created_at: '2026-01-05', tier: 'Gold', last_purchase: '2026-04-20' },
  { id: 4, name: 'Dewi Lestari', whatsapp: '081234567893', address: 'Kp. Baru Rt 01/02', voucher_code: 'DEW04', loyalty_count: 5, branch_id: 1, created_at: '2026-01-10', tier: 'Silver', last_purchase: '2026-05-01' },
  { id: 5, name: 'Eko Prasetyo', whatsapp: '081234567894', address: 'Jl. Melati No. 45', voucher_code: 'EKO05', loyalty_count: 10, branch_id: 1, created_at: '2026-01-15', tier: 'Silver', last_purchase: '2026-04-25' },
  { id: 6, name: 'Linda Sari', whatsapp: '081234567895', address: 'Apartemen Green View 12B', voucher_code: 'LIN06', loyalty_count: 19, branch_id: 1, created_at: '2026-01-20', tier: 'Gold', last_purchase: '2026-05-05' },
  { id: 7, name: 'Rahmat Hidayat', whatsapp: '081234567896', address: 'Jl. Diponegoro No. 8', voucher_code: 'RAH07', loyalty_count: 2, branch_id: 1, created_at: '2026-02-01', tier: 'Silver', last_purchase: '2026-05-11' },
  { id: 8, name: 'Anisa Putri', whatsapp: '081234567897', address: 'Perum Graha Asri C/12', voucher_code: 'ANI08', loyalty_count: 130, branch_id: 1, created_at: '2026-02-05', tier: 'Platinum', last_purchase: '2026-05-12' },
];

const calculateChurn = (lastPurchase) => {
  if (!lastPurchase) return 'active';
  const days = (new Date() - new Date(lastPurchase)) / (1000 * 60 * 60 * 24);
  return days > 14 ? 'churn_risk' : 'active';
};

exports.getAll = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const { search } = req.query;
    let filtered = DUMMY_CUSTOMERS;
    if (search) {
      filtered = DUMMY_CUSTOMERS.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.voucher_code.toLowerCase().includes(search.toLowerCase())
      );
    }
    return res.json({ data: filtered.map(c => ({ ...c, status: calculateChurn(c.last_purchase) })) });
  }

  try {
    const { search, branch_id, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR whatsapp ILIKE $${params.length} OR voucher_code ILIKE $${params.length})`;
    }
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const cust = DUMMY_CUSTOMERS.find(c => c.id == req.params.id) || DUMMY_CUSTOMERS[0];
    return res.json({ data: cust });
  }
  try {
    const result = await db.pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getLoyaltyInfo = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const cust = DUMMY_CUSTOMERS.find(c => c.id == req.params.id) || DUMMY_CUSTOMERS[0];
    return res.json({ 
      data: { 
        loyalty_count: cust.loyalty_count, 
        transactions_until_free: 10 - (cust.loyalty_count % 10)
      } 
    });
  }
  try {
    const result = await db.pool.query('SELECT loyalty_count FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    const count = result.rows[0].loyalty_count;
    res.json({ data: { loyalty_count: count, transactions_until_free: 10 - (count % 10) } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    const newCust = { id: Date.now(), ...req.body, loyalty_count: 0, created_at: new Date() };
    return res.json({ message: 'Customer created (Demo)', data: newCust });
  }
  try {
    const { name, whatsapp, address, branch_id } = req.body;
    const voucher_code = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    // 10-digit numeric barcode code
    const barcode_code = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const result = await db.pool.query(
      'INSERT INTO customers (name, whatsapp, address, voucher_code, barcode_code, branch_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, whatsapp, address, voucher_code, barcode_code, branch_id]
    );
    res.json({ message: 'Pelanggan berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Updated (Demo)' });
  try {
    const { name, whatsapp, address } = req.body;
    await db.pool.query(
      'UPDATE customers SET name=$1, whatsapp=$2, address=$3 WHERE id=$4',
      [name, whatsapp, address, req.params.id]
    );
    res.json({ message: 'Data pelanggan diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Deleted (Demo)' });
  try {
    await db.pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pelanggan dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
