const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/',      authenticate, requireRole('admin', 'superadmin'), ctrl.getAll);
router.post('/',     authenticate, requireRole('admin', 'superadmin'), ctrl.create);
router.put('/:id',   authenticate, requireRole('admin', 'superadmin'), ctrl.update);
router.delete('/:id',authenticate, requireRole('admin', 'superadmin'), ctrl.remove);

module.exports = router;
