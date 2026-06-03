const db = require('../config/database');

// Create attendance (check-in) dengan face recognition
exports.checkIn = async (req, res) => {
  try {
    const { courier_id, face_data, location_lat, location_lng, device_info } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date();

    // Validation
    if (!courier_id) {
      return res.status(400).json({ message: 'Courier ID wajib diisi' });
    }

    // Check if already checked in today
    const existing = await db.pool.query(
      'SELECT * FROM attendance WHERE courier_id = $1 AND DATE(check_in_time) = $2',
      [courier_id, today]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Kurir sudah absen hari ini' });
    }

    // Verify face (optional - akan diimplementasi di frontend)
    let face_verified = false;
    if (face_data) {
      // TODO: Compare with registered face in courier_faces table
      // For now, just mark as verified if face_data provided
      face_verified = true;
    }

    // Create attendance record with backward compatibility
    let insertQuery, insertParams;
    
    // Try new schema first (with separate check_in_time and check_out_time)
    try {
      insertQuery = `
        INSERT INTO attendance 
        (courier_id, branch_id, date, check_in_time, face_data, face_verified, location_lat, location_lng, device_info, created_by) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `;
      insertParams = [
        courier_id, 
        req.user.branch_id || 1, 
        today, 
        currentTime, 
        face_data, 
        face_verified, 
        location_lat, 
        location_lng, 
        device_info, 
        req.user.id
      ];
      
      const result = await db.pool.query(insertQuery, insertParams);
      
      return res.json({ 
        message: 'Absensi wajah berhasil!', 
        data: result.rows[0] 
      });
      
    } catch (schemaError) {
      // Fallback to old schema if new columns don't exist
      console.log('Trying fallback schema for attendance...');
      
      insertQuery = `
        INSERT INTO attendance (courier_id, branch_id, date, status, created_by) 
        VALUES ($1, $2, $3, 'present', $4) 
        RETURNING *
      `;
      insertParams = [courier_id, req.user.branch_id || 1, today, req.user.id];
      
      const result = await db.pool.query(insertQuery, insertParams);
      
      return res.json({ 
        message: 'Absensi berhasil (mode kompatibilitas)', 
        data: result.rows[0] 
      });
    }

  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ 
      message: 'Gagal menyimpan absensi', 
      error: err.message 
    });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const { attendance_id } = req.body;

    const result = await db.pool.query(
      'UPDATE attendance SET check_out_time = NOW() WHERE id = $1 RETURNING *',
      [attendance_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance tidak ditemukan' });
    }

    res.json({ 
      message: 'Check-out berhasil', 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance today
exports.getTodayAttendance = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT a.*, c.name as courier_name, u.name as created_by_name
      FROM attendance a
      LEFT JOIN couriers c ON a.courier_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.date = $1
    `;
    
    const params = [today];

    if (branch_id) {
      query += ' AND a.branch_id = $2';
      params.push(branch_id);
    }

    query += ' ORDER BY a.check_in_time DESC';

    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { courier_id, start_date, end_date, branch_id } = req.query;

    let query = `
      SELECT a.*, c.name as courier_name, u.name as created_by_name
      FROM attendance a
      LEFT JOIN couriers c ON a.courier_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (courier_id) {
      paramCount++;
      query += ` AND a.courier_id = $${paramCount}`;
      params.push(courier_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
    }

    if (branch_id) {
      paramCount++;
      query += ` AND a.branch_id = $${paramCount}`;
      params.push(branch_id);
    }

    query += ' ORDER BY a.date DESC, a.check_in_time DESC LIMIT 100';

    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Register courier face
exports.registerFace = async (req, res) => {
  try {
    const { courier_id, face_encoding, face_image } = req.body;

    // Deactivate old faces
    await db.pool.query(
      'UPDATE courier_faces SET is_active = false WHERE courier_id = $1',
      [courier_id]
    );

    // Insert new face
    const result = await db.pool.query(
      `INSERT INTO courier_faces (courier_id, face_encoding, face_image, is_active) 
       VALUES ($1, $2, $3, true) RETURNING *`,
      [courier_id, face_encoding, face_image]
    );

    res.json({ 
      message: 'Face registration berhasil', 
      data: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get courier face
exports.getCourierFace = async (req, res) => {
  try {
    const { courier_id } = req.params;

    const result = await db.pool.query(
      'SELECT * FROM courier_faces WHERE courier_id = $1 AND is_active = true',
      [courier_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Face belum terdaftar' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete attendance (admin only)
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    await db.pool.query('DELETE FROM attendance WHERE id = $1', [id]);
    res.json({ message: 'Attendance dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = exports;
