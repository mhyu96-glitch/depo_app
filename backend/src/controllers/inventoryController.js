const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat inventory cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    
    query += ' ORDER BY type, name';
    
    const { rows } = await db.pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    let { branch_id } = req.query;
    
    // Branch filtering: branch_admin hanya lihat logs cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = `
      SELECT l.*, i.name as item_name 
      FROM inventory_logs l 
      JOIN inventory i ON l.inventory_id = i.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND i.branch_id = $${params.length}`;
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT 50';
    
    const { rows } = await db.pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id, type, qty, note } = req.body;
    const change_amount = type === 'in' ? qty : -qty;
    const client = await db.getConnection();
    try {
      await client.query('BEGIN');
      
      // Cek apakah inventory item ini milik cabang user (untuk branch_admin)
      if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
        const checkResult = await client.query(
          'SELECT branch_id FROM inventory WHERE id = $1',
          [id]
        );
        if (checkResult.rows.length === 0 || checkResult.rows[0].branch_id !== req.user.branch_id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Akses ditolak: item inventory bukan milik cabang Anda' });
        }
      }
      
      // Update stock
      await client.query(
        'UPDATE inventory SET current = current + $1 WHERE id = $2',
        [change_amount, id]
      );
      
      // Log to inventory_logs
      await client.query(
        'INSERT INTO inventory_logs (inventory_id, user_id, change_amount, reason) VALUES ($1, $2, $3, $4)',
        [id, req.user?.id || null, change_amount, note || null]
      );
      
      await client.query('COMMIT');
      
      // Fetch updated item
      const itemRes = await db.pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
      res.json({ data: itemRes.rows[0] });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
