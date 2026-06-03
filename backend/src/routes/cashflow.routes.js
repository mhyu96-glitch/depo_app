const router = require('express').Router();
const ctrl = require('../controllers/cashflowController');
const { authenticate } = require('../middleware/auth');
const { requireBranchAccess, requireRole } = require('../middleware/rbac');

// Kasir bisa input kas toko
router.get('/', authenticate, requireRole('admin', 'branch_admin', 'kasir', 'superadmin'), requireBranchAccess, ctrl.getAll);
router.post('/', authenticate, requireRole('admin', 'branch_admin', 'kasir', 'superadmin'), requireBranchAccess, ctrl.create);
router.put('/:id', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.remove);

module.exports = router;
