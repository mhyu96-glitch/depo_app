const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    let query = `
      SELECT u.*, b.name as branch_name,
        (SELECT id FROM couriers WHERE user_id = u.id AND is_active = true LIMIT 1) as courier_id
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id 
      WHERE 1=1
    `;
    const params = [];

    // Branch admin hanya bisa lihat user di cabangnya
    if (req.user.role === 'branch_admin') {
      params.push(req.user.branch_id);
      query += ` AND (u.branch_id = $${params.length} OR u.branch_id IS NULL)`;
    }

    query += ' ORDER BY u.id';

    const result = await db.pool.query(query, params);
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
      [username, hashed, name, role, branch_id || null]
    );
    res.json({ message: 'User berhasil ditambahkan' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Username sudah digunakan' });
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, role, branch_id, password, is_active } = req.body;
    let query = 'UPDATE users SET name=$1, role=$2, branch_id=$3, is_active=$4';
    const params = [name, role, branch_id || null, is_active ?? true];
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

// ─── ROLLING: Jadikan kurir sebagai kasir ────────────────────────────────────
// POST /users/courier-to-kasir
// Body: { courier_id, username, password }
exports.courierToKasir = async (req, res) => {
  const client = await db.getConnection();
  try {
    await client.query('BEGIN');
    const { courier_id, username, password } = req.body;
    if (!courier_id || !username || !password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'courier_id, username, dan password wajib diisi' });
    }

    // Branch filtering: branch_admin hanya bisa rolling kurir cabangnya
    let courierQuery = 'SELECT * FROM couriers WHERE id = $1';
    const courierParams = [courier_id];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      courierQuery += ' AND branch_id = $2';
      courierParams.push(req.user.branch_id);
    }

    // Ambil data kurir
    const courierRes = await client.query(courierQuery, courierParams);
    if (courierRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Kurir tidak ditemukan atau bukan milik cabang Anda' });
    }
    const courier = courierRes.rows[0];

    // Cek apakah username sudah digunakan
    const existUser = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Username "${username}" sudah digunakan` });
    }

    // Cek apakah kurir sudah punya user account
    if (courier.user_id) {
      // Jika kurir sudah punya akun user, update role dan credentials
      const hashed = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4',
        [username, hashed, 'kasir', courier.user_id]
      );
      
      await client.query('COMMIT');
      return res.json({ message: `${courier.name} berhasil dijadikan kasir dengan username "${username}" (akun existing diupdate)` });
    } else {
      // Jika kurir belum punya akun, buat akun baru
      const hashed = await bcrypt.hash(password, 10);
      const userRes = await client.query(
        'INSERT INTO users (name, username, password, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [courier.name, username, hashed, 'kasir', courier.branch_id]
      );

      // Hubungkan kurir dengan user baru
      await client.query('UPDATE couriers SET user_id = $1 WHERE id = $2', [userRes.rows[0].id, courier_id]);

      await client.query('COMMIT');
      return res.json({ message: `${courier.name} berhasil dijadikan kasir dengan username "${username}" (akun baru dibuat)` });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error', error: err.message });
  } finally {
    if (client.release) client.release();
  }
};

// ─── ROLLING: Jadikan kasir sebagai kurir ────────────────────────────────────
// POST /users/kasir-to-courier
// Body: { user_id, phone, base_salary }
exports.kasirToCourier = async (req, res) => {
  const client = await db.getConnection();
  try {
    await client.query('BEGIN');
    const { user_id, phone, base_salary } = req.body;
    if (!user_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'user_id wajib diisi' });
    }

    // Branch filtering: branch_admin hanya bisa rolling user cabangnya
    let userQuery = 'SELECT * FROM users WHERE id = $1';
    const userParams = [user_id];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      userQuery += ' AND branch_id = $2';
      userParams.push(req.user.branch_id);
    }

    // Ambil data user
    const userRes = await client.query(userQuery, userParams);
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User tidak ditemukan atau bukan milik cabang Anda' });
    }
    const user = userRes.rows[0];

    // Cek apakah sudah terdaftar sebagai kurir
    const existCourier = await client.query(
      'SELECT id FROM couriers WHERE user_id = $1 AND is_active = true', [user_id]
    );
    if (existCourier.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `${user.name} sudah terdaftar sebagai kurir aktif` });
    }

    const courierRes = await client.query(
      'INSERT INTO couriers (name, phone, branch_id, base_salary, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user.name, phone || null, user.branch_id, parseFloat(base_salary) || 0, user_id]
    );

    await client.query('COMMIT');
    res.json({ message: `${user.name} berhasil ditambahkan sebagai kurir`, courier_id: courierRes.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error', error: err.message });
  } finally {
    if (client.release) client.release();
  }
};
