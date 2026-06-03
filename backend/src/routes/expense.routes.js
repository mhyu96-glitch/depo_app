const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBranchAccess } = require('../middleware/rbac');

// Kasir bisa input pengeluaran toko
router.get('/', authenticate, requireRole('admin', 'branch_admin', 'kasir', 'superadmin'), requireBranchAccess, ctrl.getAll);
router.get('/stats', authenticate, requireRole('admin', 'branch_admin', 'kasir', 'superadmin'), requireBranchAccess, ctrl.getStats);
router.post('/', authenticate, requireRole('admin', 'branch_admin', 'kasir', 'superadmin'), requireBranchAccess, ctrl.create);

module.exports = router;
