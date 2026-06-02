const db = require('../config/database');

exports.getAllVehicles = async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT v.*, b.name as branch_name 
       FROM fleet_vehicles v
       LEFT JOIN branches b ON v.branch_id = b.id
       ORDER BY v.id ASC`
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { branch_id, plate, model, status } = req.body;
    const result = await db.pool.query(
      `INSERT INTO fleet_vehicles (branch_id, plate, model, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [branch_id || 1, plate, model, status || 'ready']
    );
    
    // Fetch branch name to match frontend expected structure
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
  // Map standard routing endpoint
  try {
    const result = await db.pool.query(
      `SELECT m.*, v.plate 
       FROM fleet_maintenance m
       LEFT JOIN fleet_vehicles v ON m.vehicle_id = v.id
       ORDER BY m.date DESC, m.id DESC`
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Aliases to match whatever route pattern is defined in backend
exports.getMaintenanceLogs = exports.getMainMaintenanceLogs;

exports.createMaintenanceLog = async (req, res) => {
  const { plate, description, cost, date, branch_id } = req.body;
  let client;
  try {
    client = await db.getConnection();
    await client.query('BEGIN');

    // Find vehicle by plate
    const vehicleRes = await client.query('SELECT id FROM fleet_vehicles WHERE plate = $1', [plate]);
    if (vehicleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `Kendaraan dengan plat ${plate} tidak ditemukan` });
    }
    const vehicle_id = vehicleRes.rows[0].id;

    // Create log
    const logRes = await client.query(
      `INSERT INTO fleet_maintenance (vehicle_id, branch_id, description, cost, status, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, branch_id || 1, description, cost || 0, 'pending', date || new Date().toISOString().split('T')[0]]
    );

    // Update vehicle status
    await client.query('UPDATE fleet_vehicles SET status = $1 WHERE id = $2', ['maintenance', vehicle_id]);

    await client.query('COMMIT');

    res.json({ data: { ...logRes.rows[0], plate } });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error', error: err.message });
  } finally {
    if (client && client.release) client.release();
  }
};
