const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat kurir cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = `
      SELECT c.*, b.name AS branch_name
      FROM couriers c
      LEFT JOIN branches b ON b.id = c.branch_id
      WHERE c.is_active = true
    `;
    const params = [];
    if (branch_id) {
      params.push(branch_id);
      query += ` AND c.branch_id = $${params.length}`;
    }
    query += ' ORDER BY c.name ASC';
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
    let { name, phone, branch_id, base_salary } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama kurir wajib diisi' });

    // Branch filtering: branch_admin hanya bisa create untuk cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    if (!branch_id) return res.status(400).json({ message: 'Cabang wajib dipilih' });

    const result = await db.pool.query(
      'INSERT INTO couriers (name, phone, branch_id, base_salary) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone || null, parseInt(branch_id), parseFloat(base_salary) || 0]
    );
    res.json({ message: 'Kurir berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    let { name, phone, branch_id, base_salary, is_active } = req.body;
    
    // Branch filtering: branch_admin hanya bisa update kurir cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
      
      // Verifikasi kurir adalah milik cabang user
      const courierCheck = await db.pool.query(
        'SELECT branch_id FROM couriers WHERE id = $1',
        [req.params.id]
      );
      
      if (courierCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Kurir tidak ditemukan' });
      }
      
      if (courierCheck.rows[0].branch_id !== req.user.branch_id) {
        return res.status(403).json({ message: 'Akses ditolak: kurir bukan milik cabang Anda' });
      }
    }
    
    await db.pool.query(
      'UPDATE couriers SET name=$1, phone=$2, branch_id=$3, base_salary=$4, is_active=$5 WHERE id=$6',
      [name, phone || null, parseInt(branch_id), parseFloat(base_salary) || 0, is_active ?? true, req.params.id]
    );
    res.json({ message: 'Data kurir diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya bisa delete kurir cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      const courierCheck = await db.pool.query(
        'SELECT branch_id FROM couriers WHERE id = $1',
        [req.params.id]
      );
      
      if (courierCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Kurir tidak ditemukan' });
      }
      
      if (courierCheck.rows[0].branch_id !== req.user.branch_id) {
        return res.status(403).json({ message: 'Akses ditolak: kurir bukan milik cabang Anda' });
      }
    }
    
    await db.pool.query('UPDATE couriers SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kurir dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
