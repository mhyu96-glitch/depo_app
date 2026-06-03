const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat expense cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = "SELECT * FROM cash_flow WHERE type = 'expense'";
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    let { category, amount, branch_id, note, date } = req.body;
    
    // Branch filtering: branch_admin hanya bisa create untuk cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const result = await db.pool.query(
      `INSERT INTO cash_flow (category, amount, type, branch_id, description, created_at) 
       VALUES ($1, $2, 'expense', $3, $4, $5) RETURNING *`,
      [category, amount, branch_id, note, date || new Date()]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat stats cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let totalQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM cash_flow WHERE type = 'expense'";
    let categoryQuery = "SELECT category, SUM(amount) as amount FROM cash_flow WHERE type = 'expense'";
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      totalQuery += ` AND branch_id = $${params.length}`;
      categoryQuery += ` AND branch_id = $${params.length}`;
    }
    
    categoryQuery += ' GROUP BY category';
    
    const totalRes = await db.pool.query(totalQuery, params);
    const categoryRes = await db.pool.query(categoryQuery, params);
    
    const byCategory = {};
    categoryRes.rows.forEach(r => {
      byCategory[r.category] = parseFloat(r.amount);
    });

    res.json({ data: { total: parseFloat(totalRes.rows[0].total), byCategory } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
