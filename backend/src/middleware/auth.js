const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  console.log('[DEBUG AUTH] authenticate called for', req.path);
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[DEBUG AUTH] No token provided');
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[DEBUG AUTH] Token verified for user ID:', decoded.id);

    // DEMO MODE BYPASS
    if (process.env.DEMO_MODE === 'true' && decoded.id <= 2) {
      console.log('[DEBUG AUTH] DEMO MODE Bypass activated');
      req.user = decoded;
      return next();
    }

    console.log('[DEBUG AUTH] Querying database for user validation...');
    // Standard Auth
    const result = await db.pool.query(
      'SELECT id, name, username, role, branch_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    console.log('[DEBUG AUTH] DB query completed');

    const user = result.rows[0];
    if (!user || !user.is_active) {
      console.log('[DEBUG AUTH] User not active or not found');
      return res.status(401).json({ success: false, message: 'Akun tidak aktif atau tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[DEBUG AUTH] Catch block error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token kadaluarsa, silakan login kembali' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

module.exports = { authenticate };
