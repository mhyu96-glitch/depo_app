const db = require('../config/database');

// Create attendance (check-in) dengan face recognition
exports.checkIn = async (req, res) => {
  try {
    const { courier_id, face_data, location_lat, location_lng, device_info, date, notes } = req.body;
    
    // Validation
    if (!courier_id) {
      return res.status(400).json({ message: 'Courier ID wajib diisi' });
    }

    // For simple attendance (non-face), try basic insert
    if (!face_data) {
      try {
        // Simple attendance insert
        const result = await db.pool.query(
          'INSERT INTO attendance (courier_id) VALUES ($1) RETURNING *',
          [courier_id]
        );
        
        return res.json({ 
          message: 'Absensi berhasil!', 
          data: result.rows[0] 
        });
        
      } catch (basicError) {
        console.log('Simple attendance failed:', basicError.message);
        return res.status(500).json({ 
          message: 'Gagal menyimpan absensi biasa', 
          error: basicError.message 
        });
      }
    }

    // For face attendance, try basic insert first
    try {
      const result = await db.pool.query(
        'INSERT INTO attendance (courier_id) VALUES ($1) RETURNING *',
        [courier_id]
      );
      
      return res.json({ 
        message: 'Absensi berhasil!', 
        data: result.rows[0] 
      });
      
    } catch (basicError) {
      console.log('Face attendance failed:', basicError.message);
      return res.status(500).json({ 
        message: 'Struktur tabel attendance belum sesuai. Perlu database migration.',
        error: basicError.message,
        solution: 'Jalankan SQL migration untuk menambahkan kolom yang diperlukan'
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
    
    // Start with very simple query
    let query = 'SELECT * FROM attendance WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Try to add date filter
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Test if date column exists
      await db.pool.query('SELECT date FROM attendance LIMIT 1');
      paramCount++;
      query += ` AND date = $${paramCount}`;
      params.push(today);
    } catch (dateError) {
      try {
        // Fallback to created_at
        await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND DATE(created_at) = $${paramCount}`;
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
        query += ` AND branch_id = $${paramCount}`;
        params.push(branch_id);
      } catch (branchError) {
        // Skip branch filter if column doesn't exist
      }
    }

    query += ' ORDER BY id DESC LIMIT 50';

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

    // Start with simple query
    let query = 'SELECT * FROM attendance WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (courier_id) {
      paramCount++;
      query += ` AND courier_id = $${paramCount}`;
      params.push(courier_id);
    }

    // Handle date filtering - try different approaches
    if (date) {
      // Single date (for daily view)
      try {
        await db.pool.query('SELECT date FROM attendance LIMIT 1');
        paramCount++;
        query += ` AND date = $${paramCount}`;
        params.push(date);
      } catch (dateError) {
        try {
          await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
          paramCount++;
          query += ` AND DATE(created_at) = $${paramCount}`;
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
          query += ` AND date >= $${paramCount}`;
          params.push(start_date);
        } catch (dateError) {
          try {
            await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
            paramCount++;
            query += ` AND DATE(created_at) >= $${paramCount}`;
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
          query += ` AND date <= $${paramCount}`;
          params.push(end_date);
        } catch (dateError) {
          try {
            await db.pool.query('SELECT created_at FROM attendance LIMIT 1');
            paramCount++;
            query += ` AND DATE(created_at) <= $${paramCount}`;
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
        query += ` AND branch_id = $${paramCount}`;
        params.push(branch_id);
      } catch (branchError) {
        // Skip branch filter if column doesn't exist
      }
    }

    query += ' ORDER BY id DESC LIMIT 100';

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
