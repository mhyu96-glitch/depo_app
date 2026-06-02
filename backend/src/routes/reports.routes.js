const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/sales',       authenticate, requireRole('admin'), ctrl.getSalesReport);
router.get('/salary',      authenticate, requireRole('admin'), ctrl.getSalaryReport);
router.get('/cashflow',    authenticate, requireRole('admin'), ctrl.getCashFlowReport);
router.get('/debt',        authenticate, requireRole('admin'), ctrl.getDebtReport);
router.get('/profit-loss', authenticate, requireRole('admin'), ctrl.getProfitLossReport);

module.exports = router;
