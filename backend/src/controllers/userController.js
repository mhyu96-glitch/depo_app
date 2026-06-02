const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id ORDER BY u.id'
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, password, name, role, branch_id } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await db.pool.query(
      'INSERT INTO users (username, password, name, role, branch_id) VALUES ($1, $2, $3, $4, $5)',
      [username, hashed, name, role, branch_id]
    );
    res.json({ message: 'User berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, role, branch_id, password } = req.body;
    let query = 'UPDATE users SET name=$1, role=$2, branch_id=$3';
    const params = [name, role, branch_id];
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      params.push(hashed);
      query += `, password=$${params.length}`;
    }
    params.push(req.params.id);
    query += ` WHERE id=$${params.length}`;
    await db.pool.query(query, params);
    res.json({ message: 'User diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
