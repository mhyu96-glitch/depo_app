const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT s.*, u.name as user_name, b.name as branch_name 
       FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN branches b ON s.branch_id = b.id
       ORDER BY s.opened_at DESC LIMIT 50`
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getActive = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT s.*, u.name as user_name, b.name as branch_name 
       FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.user_id=$1 AND s.status='open' LIMIT 1`,
      [req.user.id]
    );
    if (!rows[0]) return res.json({ data: null });

    const salesRes = await db.pool.query(
      `SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count
       FROM transactions
       WHERE user_id=$1 AND created_at >= $2`,
      [req.user.id, rows[0].opened_at]
    );

    res.json({
      data: {
        ...rows[0],
        total_sales: parseFloat(salesRes.rows[0].total),
        total_transactions: parseInt(salesRes.rows[0].count, 10)
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.open = async (req, res) => {
  try {
    const { opening_cash, notes } = req.body;
    const existing = await db.pool.query('SELECT id FROM shifts WHERE user_id=$1 AND status=$2', [req.user.id, 'open']);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Shift sudah dibuka. Tutup shift dulu.' });
    const { rows } = await db.pool.query(
      'INSERT INTO shifts (user_id, branch_id, opening_cash, status, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, req.user.branch_id, opening_cash, 'open', notes]
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.close = async (req, res) => {
  try {
    const { closing_cash, notes } = req.body;
    const shiftRes = await db.pool.query('SELECT * FROM shifts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!shiftRes.rows[0]) return res.status(404).json({ message: 'Shift tidak ditemukan' });
    const shift = shiftRes.rows[0];
    const salesRes = await db.pool.query(
      `SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count 
       FROM transactions WHERE user_id=$1 AND created_at >= $2`,
      [req.user.id, shift.opened_at]
    );
    const total_sales = parseFloat(salesRes.rows[0].total);
    const expected = parseFloat(shift.opening_cash) + total_sales;
    const diff = parseFloat(closing_cash) - expected;
    const columnsRes = await db.pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='shifts'
    `);
    const columns = new Set(columnsRes.rows.map(row => row.column_name));
    const fields = [
      'status=$1',
      'closing_cash=$2',
      'expected_cash=$3',
      'difference=$4',
      'closed_at=NOW()',
      'notes=$5'
    ];
    const params = ['closed', closing_cash, expected, diff, notes];

    if (columns.has('total_sales')) {
      params.push(total_sales);
      fields.push(`total_sales=$${params.length}`);
    }
    if (columns.has('total_transactions')) {
      params.push(salesRes.rows[0].count);
      fields.push(`total_transactions=$${params.length}`);
    }

    params.push(req.params.id);
    const { rows } = await db.pool.query(
      `UPDATE shifts SET ${fields.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
