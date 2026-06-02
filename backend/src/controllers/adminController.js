const db = require('../config/database');

// Branch Controller
exports.branch_getAll = async (req, res) => {
  try {
    const result = await db.pool.query('SELECT b.*, (SELECT COUNT(*) FROM users WHERE branch_id = b.id) as user_count FROM branches b ORDER BY name ASC');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.branch_create = async (req, res) => {
  try {
    const { name, code, address, phone } = req.body;
    const result = await db.pool.query(
      'INSERT INTO branches (name, code, address, phone) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, code, address, phone]
    );
    res.status(201).json({ message: 'Cabang ditambahkan', data: { id: result.rows[0].id } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.branch_update = async (req, res) => {
  try {
    const { name, code, address, phone } = req.body;
    await db.pool.query(
      'UPDATE branches SET name=$1, code=$2, address=$3, phone=$4 WHERE id=$5',
      [name, code, address, phone, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Courier Controller
exports.courier_getAll = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = 'SELECT c.*, b.name as branch_name FROM couriers c LEFT JOIN branches b ON c.branch_id = b.id WHERE 1=1';
    const params = [];
    if (branch_id) {
      sql += ' AND c.branch_id = $1';
      params.push(branch_id);
    }
    sql += ' ORDER BY c.name ASC';
    const result = await db.pool.query(sql, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.courier_create = async (req, res) => {
  try {
    const { name, phone, branch_id, base_salary } = req.body;
    const result = await db.pool.query(
      'INSERT INTO couriers (name, phone, branch_id, base_salary) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, phone, branch_id, base_salary]
    );
    res.status(201).json({ message: 'Kurir ditambahkan', data: { id: result.rows[0].id } });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Product Controller
exports.product_getAll = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let sql = 'SELECT p.*, b.name as branch_name FROM products p LEFT JOIN branches b ON p.branch_id = b.id WHERE 1=1';
    const params = [];
    if (branch_id) {
      sql += ' AND p.branch_id = $1';
      params.push(branch_id);
    }
    const result = await db.pool.query(sql, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.product_update = async (req, res) => {
  try {
    const { price } = req.body;
    await db.pool.query('UPDATE products SET price=$1 WHERE id=$2', [price, req.params.id]);
    res.json({ message: 'Price updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
