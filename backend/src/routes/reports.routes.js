const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireAdminOrSuperAdmin } = require('../middleware/rbac');

// branch_admin bisa lihat HANYA laporan penjualan
router.get('/sales',       authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getSalesReport);

// Admin pusat & superadmin bisa lihat semua laporan kecuali laba rugi
router.get('/salary',      authenticate, requireAdminOrSuperAdmin, ctrl.getSalaryReport);
router.get('/cashflow',    authenticate, requireAdminOrSuperAdmin, ctrl.getCashFlowReport);
router.get('/debt',        authenticate, requireAdminOrSuperAdmin, ctrl.getDebtReport);

// Laba rugi HANYA superadmin dan admin pusat
router.get('/profit-loss', authenticate, requireAdminOrSuperAdmin, ctrl.getProfitLossReport);

module.exports = router;
