const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await db.pool.query('SELECT * FROM inventory ORDER BY type, name');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT l.*, i.name as item_name FROM inventory_logs l 
       JOIN inventory i ON l.inventory_id = i.id 
       ORDER BY l.created_at DESC LIMIT 50`
    );
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
