const db = require('../config/database');

const DUMMY_CASHFLOW = [
  { id: 1, type: 'income', category: 'Penjualan Galon', description: 'Hasil penjualan harian', amount: 5400000, created_at: '2026-05-10', branch_id: 1 },
  { id: 2, type: 'expense', category: 'Operasional', description: 'Bayar Listrik Bulanan', amount: 450000, created_at: '2026-05-11', branch_id: 1 },
  { id: 3, type: 'expense', category: 'Operasional', description: 'Beli ATK & Lakban', amount: 75000, created_at: '2026-05-12', branch_id: 1 },
  { id: 4, type: 'income', category: 'Lain-lain', description: 'Penjualan Botol Kosong', amount: 150000, created_at: '2026-05-12', branch_id: 1 },
  { id: 5, type: 'expense', category: 'Gaji', description: 'Panjar Gaji Kurir Erik', amount: 500000, created_at: '2026-05-13', branch_id: 1 },
];

exports.getAll = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ data: DUMMY_CASHFLOW });
  try {
    const { branch_id, start_date, end_date } = req.query;
    let query = 'SELECT * FROM cash_flow WHERE 1=1';
    const params = [];
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    if (start_date && end_date) {
      params.push(start_date, end_date);
      query += ` AND created_at::date BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Created (Demo)', data: { id: 99, ...req.body } });
  try {
    const { type, category, description, amount, branch_id } = req.body;
    const result = await db.pool.query(
      'INSERT INTO cash_flow (type, category, description, amount, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [type, category, description, amount, branch_id]
    );
    res.json({ message: 'Catatan kas berhasil disimpan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Updated (Demo)' });
  try {
    const { type, category, description, amount } = req.body;
    await db.pool.query(
      'UPDATE cash_flow SET type=$1, category=$2, description=$3, amount=$4 WHERE id=$5',
      [type, category, description, amount, req.params.id]
    );
    res.json({ message: 'Catatan kas diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') return res.json({ message: 'Deleted (Demo)' });
  try {
    await db.pool.query('DELETE FROM cash_flow WHERE id = $1', [req.params.id]);
    res.json({ message: 'Catatan kas dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
