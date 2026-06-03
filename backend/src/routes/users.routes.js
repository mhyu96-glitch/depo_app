const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/',                    authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getAll);
router.post('/',                   authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.create);
router.put('/:id',                 authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.update);
router.delete('/:id',              authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.remove);

// Rolling routes - branch admin can also do rolling
router.post('/courier-to-kasir',   authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.courierToKasir);
router.post('/kasir-to-courier',   authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.kasirToCourier);

module.exports = router;
