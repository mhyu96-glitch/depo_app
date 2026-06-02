const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const result = await db.pool.query("SELECT * FROM cash_flow WHERE type = 'expense' ORDER BY date DESC");
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { category, amount, branch_id, note, date } = req.body;
    const result = await db.pool.query(
      `INSERT INTO cash_flow (category, amount, type, branch_id, description, date) 
       VALUES ($1, $2, 'expense', $3, $4, $5) RETURNING *`,
      [category, amount, branch_id, note, date]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalRes = await db.pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM cash_flow WHERE type = 'expense'");
    const categoryRes = await db.pool.query(
      "SELECT category, SUM(amount) as amount FROM cash_flow WHERE type = 'expense' GROUP BY category"
    );
    
    const byCategory = {};
    categoryRes.rows.forEach(r => {
      byCategory[r.category] = parseFloat(r.amount);
    });

    res.json({ data: { total: parseFloat(totalRes.rows[0].total), byCategory } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
