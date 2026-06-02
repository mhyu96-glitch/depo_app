const db = require('../config/database');

exports.getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    let query = `
      SELECT created_at::date as date, SUM(total_amount) as total_sales, COUNT(*) as transaction_count,
      (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE created_at::date = t.created_at::date)) as gallon_count
      FROM transactions t WHERE 1=1`;
    const params = [];
    if (branch_id) { params.push(branch_id); query += ` AND branch_id = $${params.length}`; }
    if (start_date && end_date) { params.push(start_date, end_date); query += ` AND created_at::date BETWEEN $${params.length - 1} AND $${params.length}`; }
    query += ' GROUP BY date ORDER BY date DESC';
    const result = await db.pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getSalaryReport = async (req, res) => {
  try {
    const { month, year, branch_id } = req.query;
    const result = await db.pool.query(
      `SELECT c.id as courier_id, c.name as courier_name, COUNT(t.id) as delivery_count, SUM(t.commission_amount) as total_commission
       FROM couriers c
       LEFT JOIN transactions t ON c.id = t.courier_id AND EXTRACT(MONTH FROM t.created_at) = $1 AND EXTRACT(YEAR FROM t.created_at) = $2
       WHERE c.branch_id = $3
       GROUP BY c.id, c.name`,
      [month, year, branch_id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getCashFlowReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;
    const result = await db.pool.query(
      `SELECT created_at::date as date, 
       SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
       FROM cash_flow WHERE branch_id = $1 AND created_at::date BETWEEN $2 AND $3
       GROUP BY date ORDER BY date DESC`,
      [branch_id, start_date, end_date]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getDebtReport = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const result = await db.pool.query(
      "SELECT * FROM transactions WHERE payment_status != 'paid' AND branch_id = $1",
      [branch_id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.getProfitLossReport = async (req, res) => {
  try {
    const { month, year, branch_id } = req.query;
    const sales = await db.pool.query("SELECT SUM(total_amount) as total FROM transactions WHERE branch_id=$1 AND EXTRACT(MONTH FROM created_at)=$2 AND EXTRACT(YEAR FROM created_at)=$3", [branch_id, month, year]);
    const expenses = await db.pool.query("SELECT SUM(amount) as total FROM cash_flow WHERE branch_id=$1 AND type='expense' AND EXTRACT(MONTH FROM created_at)=$2 AND EXTRACT(YEAR FROM created_at)=$3", [branch_id, month, year]);
    
    const totalSales = parseFloat(sales.rows[0].total || 0);
    const totalExpenses = parseFloat(expenses.rows[0].total || 0);
    
    res.json({
      data: {
        total_sales: totalSales,
        operating_expenses: totalExpenses,
        net_profit: totalSales - totalExpenses
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
