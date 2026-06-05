const db = require('../config/database');

// Create attendance (check-in) dengan face recognition
exports.checkIn = async (req, res) => {
  try {
    const { courier_id, face_data, location_lat, location_lng, device_info, date, notes } = req.body;
    
    // Validation
    if (!courier_id) {
      return res.status(400).json({ message: 'Courier ID wajib diisi' });
    }

    const columnsResult = await db.pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'attendance'
    `);
    const columns = new Set(columnsResult.rows.map(row => row.column_name));
    const fields = ['courier_id'];
    const values = [courier_id];
    const requestedDate = date || new Date().toISOString().split('T')[0];
    const branchId = req.body.branch_id || req.user?.branch_id || null;

    const addIfExists = (column, value) => {
      if (columns.has(column)) {
        fields.push(column);
        values.push(value);
      }
    };

    addIfExists('branch_id', branchId);
    addIfExists('date', requestedDate);
    addIfExists('notes', notes || null);
    addIfExists('face_data', face_data || null);
    addIfExists('face_verified', Boolean(face_data));
    addIfExists('location_lat', location_lat || null);
    addIfExists('location_lng', location_lng || null);
    addIfExists('device_info', device_info || null);
    addIfExists('check_in_time', new Date());

    const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
    const result = await db.pool.query(
      `INSERT INTO attendance (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return res.json({
      message: 'Absensi berhasil!',
      data: result.rows[0]
    });

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
    
    // Start with query that includes courier display name for the frontend
    let query = `
      SELECT a.*, c.name as courier_name
      FROM attendance a
      LEFT JOIN couriers c ON c.id = a.courier_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Try to add date filter
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Test if date column exists
      await db.pool.query('SELECT date FROM attendance LIMIT 1');
      paramCount++;
      query += ` AND a.date = $${paramCount}`;
      params.push(today);
    } catch (dateError) {
      try {
        // Fallback to created_at
        await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND DATE(a.created_at) = $${paramCount}`;
        params.push(today);
      } catch (createdAtError) {
        // No date filtering if neither column exists
      }
    }

    // Add branch filter if column exists
    if (branch_id) {
      try {
        await db.pool.query('SELECT branch_id FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND a.branch_id = $${paramCount}`;
        params.push(branch_id);
      } catch (branchError) {
        // Skip branch filter if column doesn't exist
      }
    }

    query += ' ORDER BY a.id DESC LIMIT 50';

    console.log('Simple today attendance query:', query, 'params:', params);
    const result = await db.pool.query(query, params);
    
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Today attendance error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { courier_id, start_date, end_date, branch_id, date } = req.query;

    // Include courier display name for Attendance.jsx
    let query = `
      SELECT a.*, c.name as courier_name
      FROM attendance a
      LEFT JOIN couriers c ON c.id = a.courier_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (courier_id) {
      paramCount++;
      query += ` AND a.courier_id = $${paramCount}`;
      params.push(courier_id);
    }

    // Handle date filtering - try different approaches
    if (date) {
      // Single date (for daily view)
      try {
        await db.pool.query('SELECT date FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND a.date = $${paramCount}`;
        params.push(date);
      } catch (dateError) {
        try {
          await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
          paramCount++;
          query += ` AND DATE(a.created_at) = $${paramCount}`;
          params.push(date);
        } catch (createdAtError) {
          // Skip date filter if no date columns
        }
      }
    } else {
      // Date range filtering
      if (start_date) {
        try {
          await db.pool.query('SELECT date FROM attendance LIMIT 1');
          paramCount++;
          query += ` AND a.date >= $${paramCount}`;
          params.push(start_date);
        } catch (dateError) {
          try {
            await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
            paramCount++;
            query += ` AND DATE(a.created_at) >= $${paramCount}`;
            params.push(start_date);
          } catch (createdAtError) {
            // Skip start_date filter
          }
        }
      }

      if (end_date) {
        try {
          await db.pool.query('SELECT date FROM attendance LIMIT 1');
          paramCount++;
          query += ` AND a.date <= $${paramCount}`;
          params.push(end_date);
        } catch (dateError) {
          try {
            await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
            paramCount++;
            query += ` AND DATE(a.created_at) <= $${paramCount}`;
            params.push(end_date);
          } catch (createdAtError) {
            // Skip end_date filter
          }
        }
      }
    }

    if (branch_id) {
      try {
        await db.pool.query('SELECT branch_id FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND a.branch_id = $${paramCount}`;
        params.push(branch_id);
      } catch (branchError) {
        // Skip branch filter if column doesn't exist
      }
    }

    query += ' ORDER BY a.id DESC LIMIT 100';

    console.log('Attendance history query:', query, 'params:', params);
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Attendance history error:', err);
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
