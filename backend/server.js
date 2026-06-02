const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://depo-app.pages.dev',
  'https://depo178.site',
];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.workers.dev') ||
      origin.includes('depo178.site') ||
      origin.includes('vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json());
app.use(morgan('dev'));

// Static files for frontend (if built)
const path = require('path');
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Routes
app.use('/api/auth',         require('./src/routes/auth.routes'));
app.use('/api/portal',       require('./src/routes/portal.routes')); // PUBLIC - no auth
app.use('/api/branches',     require('./src/routes/branches.routes'));
app.use('/api/customers',    require('./src/routes/customers.routes'));
app.use('/api/transactions', require('./src/routes/transactions.routes'));
app.use('/api/approvals',    require('./src/routes/approvals.routes')); // NEW - Transaction approvals
app.use('/api/attendance',   require('./src/routes/attendance.routes'));
app.use('/api/cashflow',     require('./src/routes/cashflow.routes'));
app.use('/api/couriers',     require('./src/routes/couriers.routes'));
app.use('/api/products',     require('./src/routes/products.routes'));
app.use('/api/reports',      require('./src/routes/reports.routes'));
app.use('/api/dashboard',    require('./src/routes/dashboard.routes'));
app.use('/api/users',        require('./src/routes/users.routes'));
app.use('/api/fleet',        require('./src/routes/fleet.routes'));
app.use('/api/inventory',    require('./src/routes/inventory.routes'));
app.use('/api/expenses',     require('./src/routes/expense.routes'));
app.use('/api/assets',       require('./src/routes/asset.routes'));
app.use('/api/audit',        require('./src/routes/audit.routes'));
app.use('/api/whatsapp',     require('./src/routes/whatsapp.routes'));
app.use('/api/iot',          require('./src/routes/iot.routes'));
app.use('/api/procurement',  require('./src/routes/supplier.routes'));
app.use('/api/shifts',       require('./src/routes/shift.routes'));
app.use('/api/debts',        require('./src/routes/debt.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Handle SPA routing: serve index.html for any unknown routes (not starting with /api)
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    const indexPath = path.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend dist not found. Run "npm run build" in frontend folder.');
    }
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`🚀 Depo Air Minum Server running on port ${PORT}`));
}

module.exports = app;
