const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/',       authenticate, ctrl.getAll);
router.post('/',      authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.create);
router.put('/:id',    authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.remove);

module.exports = router;
