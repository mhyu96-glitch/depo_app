const db = require('../config/database');

const getInventoryColumns = async (client = db.pool) => {
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory'
  `);
  return new Set(result.rows.map(row => row.column_name));
};

exports.getAll = async (req, res) => {
  try {
    let { branch_id } = req.query;
    const columns = await getInventoryColumns();
    const stockColumn = columns.has('current') ? 'current' : 'current_stock';
    const typeSelect = columns.has('type') ? 'type' : `'supply'`;
    const capacitySelect = columns.has('capacity') ? 'capacity' : stockColumn;
    const minStockSelect = columns.has('min_stock') ? 'min_stock' : '0';
    
    // Branch filtering: branch_admin hanya lihat inventory cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    let query = `
      SELECT *,
        ${stockColumn} as current,
        ${capacitySelect} as capacity,
        ${minStockSelect} as min_stock,
        ${typeSelect} as type
      FROM inventory
      WHERE 1=1
    `;
    const params = [];
    
    if (branch_id) {
      params.push(branch_id);
      query += ` AND branch_id = $${params.length}`;
    }
    
    query += ` ORDER BY ${columns.has('type') ? 'type' : 'name'}, name`;
    
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
      SELECT l.*, i.name as item_name,
        CASE WHEN l.change_amount >= 0 THEN 'in' ELSE 'out' END as type,
        ABS(l.change_amount) as qty,
        l.reason as note,
        l.created_at as date
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
      const columns = await getInventoryColumns(client);
      const stockColumn = columns.has('current') ? 'current' : 'current_stock';
      
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
        `UPDATE inventory SET ${stockColumn} = ${stockColumn} + $1 WHERE id = $2`,
        [change_amount, id]
      );
      
      // Log to inventory_logs
      await client.query(
        'INSERT INTO inventory_logs (inventory_id, user_id, change_amount, reason) VALUES ($1, $2, $3, $4)',
        [id, req.user?.id || null, change_amount, note || null]
      );
      
      await client.query('COMMIT');
      
      // Fetch updated item
      const itemRes = await db.pool.query(
        `SELECT *, ${stockColumn} as current FROM inventory WHERE id = $1`,
        [id]
      );
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
