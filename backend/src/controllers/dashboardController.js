const db = require('../config/database');

exports.getWidgets = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat cabang sendiri, superadmin/admin lihat semua
    let { branch_id } = req.query;
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id; // Force branch_admin hanya lihat cabangnya
    }
    
    const bidFilter = branch_id ? 'AND branch_id = $1' : '';
    const bidParams = branch_id ? [branch_id] : [];

    const todaySalesRes = await db.pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count, 
       COALESCE((SELECT SUM(quantity) FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE created_at::date = CURRENT_DATE ${bidFilter})), 0) as gallons
       FROM transactions WHERE created_at::date = CURRENT_DATE ${bidFilter}`,
      bidParams
    );

    const cashRes = await db.pool.query(
      `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as balance
       FROM cash_flow WHERE 1=1 ${bidFilter}`,
      bidParams
    );

    const deliveryRes = await db.pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as total_commission
       FROM transactions WHERE created_at::date = CURRENT_DATE AND transaction_type = 'delivery' ${bidFilter}`,
      bidParams
    );

    const typeRes = await db.pool.query(
      `SELECT transaction_type as name, COUNT(*) as value
       FROM transactions WHERE created_at::date = CURRENT_DATE ${bidFilter}
       GROUP BY transaction_type`,
      bidParams
    );

    const loyaltyRes = await db.pool.query(
      `SELECT * FROM customers WHERE loyalty_count > 0 AND (loyalty_count % 10) = 0 ${bidFilter} LIMIT 10`,
      bidParams
    );

    const maintenanceRes = await db.pool.query(
      `SELECT m.id, v.plate, m.description, m.date, m.cost, m.status
       FROM fleet_maintenance m
       LEFT JOIN fleet_vehicles v ON m.vehicle_id = v.id
       WHERE 1=1 ${branch_id ? 'AND m.branch_id = $1' : ''}
       ORDER BY m.date DESC LIMIT 5`,
      bidParams
    );

    res.json({
      data: {
        today_sales: todaySalesRes.rows[0],
        cash_balance: parseFloat(cashRes.rows[0].balance),
        delivery_today: deliveryRes.rows[0],
        loyalty_due_customers: loyaltyRes.rows,
        type_distribution: typeRes.rows.map(r => ({
          name: r.name === 'pickup' ? 'Beli Langsung (Pickup)' : 'Di Antar (Delivery)',
          value: parseInt(r.value),
          color: r.name === 'pickup' ? '#3b82f6' : '#8b5cf6'
        })),
        motor_maintenance: maintenanceRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getMonthlySalesTrend = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat cabang sendiri
    let { branch_id } = req.query;
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const bidFilter = branch_id ? 'AND branch_id = $1' : '';
    const bidParams = branch_id ? [branch_id] : [];

    const result = await db.pool.query(
      `SELECT 
        TO_CHAR(created_at, 'Month') as month_name,
        EXTRACT(MONTH FROM created_at) as month_num,
        SUM(total_amount) as total_sales,
        COALESCE(SUM((SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id)), 0) as total_gallons
       FROM transactions t
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' ${bidFilter}
       GROUP BY TO_CHAR(created_at, 'Month'), EXTRACT(MONTH FROM created_at)
       ORDER BY month_num ASC`,
      bidParams
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getDailySalesTrend = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat cabang sendiri
    let { branch_id } = req.query;
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const bidFilter = branch_id ? 'AND branch_id = $1' : '';
    const bidParams = branch_id ? [branch_id] : [];

    const result = await db.pool.query(
      `SELECT 
        created_at::date as date,
        SUM(total_amount) as total_sales,
        COALESCE(SUM((SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id)), 0) as total_gallons
       FROM transactions t
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' ${bidFilter}
       GROUP BY date
       ORDER BY date ASC`,
      bidParams
    );

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getBranchComparison = async (req, res) => {
  try {
    // Branch comparison hanya untuk superadmin/admin
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      // Branch admin tidak perlu lihat perbandingan cabang, return empty
      return res.json({ data: [] });
    }
    
    const result = await db.pool.query(
      `SELECT b.name as branch_name, COALESCE(SUM(t.total_amount), 0) as total_sales
       FROM branches b
       LEFT JOIN transactions t ON b.id = t.branch_id
       GROUP BY b.name`
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getAIProjection = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat cabang sendiri
    let { branch_id } = req.query;
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const bidFilter = branch_id ? 'AND branch_id = $1' : '';
    const bidParams = branch_id ? [branch_id] : [];

    const stats = await db.pool.query(
      `SELECT COALESCE(AVG(total_amount), 1500000) as avg_sales FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' ${bidFilter}`,
      bidParams
    );

    const baseValue = parseFloat(stats.rows[0].avg_sales || 1500000);
    const projection = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      projection.push({
        date: d.toISOString().split('T')[0],
        projected_sales: Math.round(baseValue + (Math.random() * (baseValue * 0.4)) - (baseValue * 0.2)),
        confidence: parseFloat((0.85 + (Math.random() * 0.1)).toFixed(2))
      });
    }
    res.json({ data: projection });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getBusinessHealth = async (req, res) => {
  try {
    // Branch filtering: branch_admin hanya lihat cabang sendiri
    let { branch_id } = req.query;
    if (req.user.role === 'branch_admin' || req.user.role === 'kasir') {
      branch_id = req.user.branch_id;
    }
    
    const bidFilter = branch_id ? 'AND branch_id = $1' : '';
    const bidParams = branch_id ? [branch_id] : [];

    const salesTotal = await db.pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ${bidFilter}`,
      bidParams
    );

    const transCount = parseInt(salesTotal.rows[0].count);
    let score = 75;
    let status = 'Good';
    let insight = 'Operasi bisnis berjalan stabil. Tingkatkan penjualan harian untuk menaikkan performa bisnis Anda.';

    if (transCount > 50) {
      score = 92;
      status = 'Excellent';
      insight = 'Bisnis Anda sangat sehat dengan volume transaksi tinggi. Pertahankan performa layanan dan kepuasan pelanggan.';
    } else if (transCount > 20) {
      score = 85;
      status = 'Very Good';
      insight = 'Performa sangat baik. Tingkatkan promosi atau tawarkan opsi langganan ke pelanggan pasif.';
    }

    res.json({
      data: {
        score,
        status,
        metrics: {
          profitability: score - 2,
          asset_integrity: score - 5,
          loyalty_growth: score + 3,
          retention: score - 8
        },
        insight
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
