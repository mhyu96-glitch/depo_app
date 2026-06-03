const db = require('../config/database');

exports.getAllVehicles = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat kendaraan cabangnya
    let query = `
      SELECT v.*, b.name as branch_name 
      FROM fleet_vehicles v
      LEFT JOIN branches b ON v.branch_id = b.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      params.push(req.user.branch_id);
      query += ` AND v.branch_id = $${params.length}`;
    } else {
      // Superadmin/admin bisa filter berdasarkan branch_id
      const { branch_id } = req.query;
      if (branch_id) {
        params.push(branch_id);
        query += ` AND v.branch_id = $${params.length}`;
      }
    }
    
    query += ' ORDER BY v.id ASC';
    
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    let { branch_id, plate, model, status, owner_name, owner_phone } = req.body;
    
    // Branch filtering: branch_admin hanya bisa create untuk cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const result = await db.pool.query(
      `INSERT INTO fleet_vehicles (branch_id, plate, model, status, owner_name, owner_phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [branch_id || 1, plate, model, status || 'ready', owner_name || null, owner_phone || null]
    );
    
    const joined = await db.pool.query(
      `SELECT v.*, b.name as branch_name 
       FROM fleet_vehicles v
       LEFT JOIN branches b ON v.branch_id = b.id
       WHERE v.id = $1`,
      [result.rows[0].id]
    );

    res.json({ data: joined.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getMainMaintenanceLogs = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat maintenance cabangnya
    let query = `
      SELECT m.*, v.plate 
      FROM fleet_maintenance m
      LEFT JOIN fleet_vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      params.push(req.user.branch_id);
      query += ` AND m.branch_id = $${params.length}`;
    } else {
      // Superadmin/admin bisa filter berdasarkan branch_id
      const { branch_id } = req.query;
      if (branch_id) {
        params.push(branch_id);
        query += ` AND m.branch_id = $${params.length}`;
      }
    }
    
    query += ' ORDER BY m.date DESC, m.id DESC';
    
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Aliases to match whatever route pattern is defined in backend
exports.getMaintenanceLogs = exports.getMainMaintenanceLogs;

exports.createMaintenanceLog = async (req, res) => {
  let { plate, description, cost, date, branch_id } = req.body;
  let client;
  try {
    // Branch filtering: branch_admin hanya bisa create untuk cabangnya
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    client = await db.getConnection();
    await client.query('BEGIN');

    // Find vehicle by plate (dengan branch filtering jika branch_admin)
    let vehicleQuery = 'SELECT id, branch_id FROM fleet_vehicles WHERE plate = $1';
    const vehicleParams = [plate];
    
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      vehicleQuery += ' AND branch_id = $2';
      vehicleParams.push(req.user.branch_id);
    }
    
    const vehicleRes = await client.query(vehicleQuery, vehicleParams);
    if (vehicleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `Kendaraan dengan plat ${plate} tidak ditemukan atau bukan milik cabang Anda` });
    }
    const vehicle = vehicleRes.rows[0];

    // Create log
    const logRes = await client.query(
      `INSERT INTO fleet_maintenance (vehicle_id, branch_id, description, cost, status, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle.id, branch_id || vehicle.branch_id, description, cost || 0, 'pending', date || new Date().toISOString().split('T')[0]]
    );

    // Update vehicle status
    await client.query('UPDATE fleet_vehicles SET status = $1 WHERE id = $2', ['maintenance', vehicle.id]);

    await client.query('COMMIT');

    res.json({ data: { ...logRes.rows[0], plate } });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error', error: err.message });
  } finally {
    if (client && client.release) client.release();
  }
};
