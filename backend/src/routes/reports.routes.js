const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireSuperAdmin } = require('../middleware/rbac');

// Admin (cabang) bisa lihat semua laporan KECUALI laba rugi
router.get('/sales',       authenticate, requireRole('admin'), ctrl.getSalesReport);
router.get('/salary',      authenticate, requireRole('admin'), ctrl.getSalaryReport);
router.get('/cashflow',    authenticate, requireRole('admin'), ctrl.getCashFlowReport);
router.get('/debt',        authenticate, requireRole('admin'), ctrl.getDebtReport);
// Laba rugi HANYA superadmin
router.get('/profit-loss', authenticate, requireSuperAdmin, ctrl.getProfitLossReport);

module.exports = router;
