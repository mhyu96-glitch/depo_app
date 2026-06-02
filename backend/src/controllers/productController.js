const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, price, branch_id } = req.body;
    const result = await db.pool.query(
      'INSERT INTO products (name, price, branch_id) VALUES ($1, $2, $3) RETURNING *',
      [name, price, branch_id]
    );
    res.json({ message: 'Produk ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, price, is_active } = req.body;
    await db.pool.query(
      'UPDATE products SET name=$1, price=$2, is_active=$3 WHERE id=$4',
      [name, price, is_active, req.params.id]
    );
    res.json({ message: 'Produk diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
