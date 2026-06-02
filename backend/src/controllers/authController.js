const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password, branch } = req.body;

  // DEMO MODE BYPASS
  if (process.env.DEMO_MODE === 'true') {
    if ((username === 'admin' && password === 'admin123') || (username === 'kasir' && password === 'kasir123')) {
      const demoUser = {
        id: username === 'admin' ? 1 : 2,
        name: username === 'admin' ? 'Demo Admin' : 'Demo Kasir',
        username,
        role: username === 'admin' ? 'admin' : 'kasir',
        branch_id: 1,
        branch_name: branch || 'Depo Pusat'
      };
      const token = jwt.sign(demoUser, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({ 
        message: 'Login Demo Berhasil', 
        data: { token, user: demoUser } 
      });
    }
  }

  try {
    // Join dengan tabel branches untuk validasi dan ambil nama cabang
    const result = await db.pool.query(
      `SELECT u.*, b.name as branch_name 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.username = $1 AND u.is_active = true`, 
      [username]
    );
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Username atau password salah' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Username atau password salah' });

    // TIDAK ADA VALIDASI STRICT - User bisa login dari cabang manapun
    // Branch selection hanya untuk display/filter data, bukan untuk blocking login
    // Data access control tetap berdasarkan user.branch_id dari database
    
    const token = jwt.sign(
      { id: user.id, role: user.role, branch_id: user.branch_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await db.pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.json({
      message: 'Login berhasil',
      data: {
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          username: user.username, 
          role: user.role, 
          branch_id: user.branch_id,
          branch_name: user.branch_name
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  if (process.env.DEMO_MODE === 'true' && req.user.id <= 2) {
    return res.json({ data: { ...req.user, branch_name: 'Cabang Demo' } });
  }

  try {
    const result = await db.pool.query(
      `SELECT u.*, b.name as branch_name 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.id = $1`, 
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    delete user.password;
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logout berhasil' });
};

exports.changePassword = async (req, res) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.status(403).json({ message: 'Tidak dapat mengubah password dalam mode demo' });
  }
  try {
    const { old_password, new_password } = req.body;
    const result = await db.pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password lama tidak sesuai' });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
