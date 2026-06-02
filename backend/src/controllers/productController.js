const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = `
      SELECT p.*, b.name as branch_name
      FROM products p
      LEFT JOIN branches b ON b.id = p.branch_id
      WHERE 1=1
    `;
    const params = [];
    if (branch_id) {
      params.push(branch_id);
      query += ` AND p.branch_id = $${params.length}`;
    }
    query += ' ORDER BY p.name ASC';
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, price, branch_id } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama produk wajib diisi' });
    if (!price) return res.status(400).json({ message: 'Harga produk wajib diisi' });
    const result = await db.pool.query(
      'INSERT INTO products (name, price, branch_id) VALUES ($1, $2, $3) RETURNING *',
      [name, parseFloat(price), branch_id || null]
    );
    res.json({ message: 'Produk berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, price, is_active } = req.body;
    await db.pool.query(
      'UPDATE products SET name=$1, price=$2, is_active=$3 WHERE id=$4',
      [name, parseFloat(price), is_active ?? true, req.params.id]
    );
    res.json({ message: 'Produk diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.pool.query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produk dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
