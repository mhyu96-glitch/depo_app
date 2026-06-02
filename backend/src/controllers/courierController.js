const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = 'SELECT * FROM couriers WHERE is_active = true';
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

exports.getById = async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM couriers WHERE id = $1', [req.params.id]);
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, whatsapp, address, branch_id } = req.body;
    const result = await db.pool.query(
      'INSERT INTO couriers (name, whatsapp, address, branch_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, whatsapp, address, branch_id]
    );
    res.json({ message: 'Kurir berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, whatsapp, address, is_active } = req.body;
    await db.pool.query(
      'UPDATE couriers SET name=$1, whatsapp=$2, address=$3, is_active=$4 WHERE id=$5',
      [name, whatsapp, address, is_active, req.params.id]
    );
    res.json({ message: 'Data kurir diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.pool.query('UPDATE couriers SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kurir dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
