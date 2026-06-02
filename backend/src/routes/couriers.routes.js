const router = require('express').Router();
const ctrl = require('../controllers/courierController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBranchAccess } = require('../middleware/rbac');

router.get('/', authenticate, requireBranchAccess, ctrl.getAll);
router.post('/', authenticate, requireRole('admin', 'branch_manager'), requireBranchAccess, ctrl.create);
router.put('/:id', authenticate, requireRole('admin', 'branch_manager'), requireBranchAccess, ctrl.update);
router.delete('/:id', authenticate, requireRole('admin', 'branch_manager'), ctrl.remove);

module.exports = router;
