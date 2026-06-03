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
    
    // Branch admin hanya bisa lihat produk cabangnya
    if (req.user.role === 'branch_admin') {
      params.push(req.user.branch_id);
      query += ` AND (p.branch_id = $${params.length} OR p.branch_id IS NULL)`;
    } else if (branch_id) {
      // Admin/superadmin bisa filter berdasarkan branch_id yang dipilih
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
    
    // Branch admin hanya bisa create produk untuk cabangnya
    const finalBranchId = req.user.role === 'branch_admin' ? req.user.branch_id : (branch_id || null);
    
    const result = await db.pool.query(
      'INSERT INTO products (name, price, branch_id) VALUES ($1, $2, $3) RETURNING *',
      [name, parseFloat(price), finalBranchId]
    );
    res.json({ message: 'Produk berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, price, is_active } = req.body;
    
    // Branch admin hanya bisa update produk cabangnya
    let query = 'UPDATE products SET name=$1, price=$2, is_active=$3 WHERE id=$4';
    const params = [name, parseFloat(price), is_active ?? true, req.params.id];
    
    if (req.user.role === 'branch_admin') {
      query += ' AND (branch_id = $5 OR branch_id IS NULL)';
      params.push(req.user.branch_id);
    }
    
    const result = await db.pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Akses ditolak: tidak dapat mengubah produk ini' });
    }
    
    res.json({ message: 'Produk diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    // Branch admin hanya bisa remove produk cabangnya
    let query = 'UPDATE products SET is_active = false WHERE id = $1';
    const params = [req.params.id];
    
    if (req.user.role === 'branch_admin') {
      query += ' AND (branch_id = $2 OR branch_id IS NULL)';
      params.push(req.user.branch_id);
    }
    
    const result = await db.pool.query(query, params);
    
    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Akses ditolak: tidak dapat menonaktifkan produk ini' });
    }
    
    res.json({ message: 'Produk dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
