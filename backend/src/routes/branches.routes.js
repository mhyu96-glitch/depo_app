const router = require('express').Router();
const ctrl = require('../controllers/branchController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// GET branches PUBLIC - tidak butuh login (untuk dropdown halaman login)
router.get('/',       ctrl.getAll);
router.post('/',      authenticate, requireRole('admin', 'superadmin'), ctrl.create);
router.put('/:id',    authenticate, requireRole('admin', 'superadmin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), ctrl.remove);

module.exports = router;
