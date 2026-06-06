const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/commission', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getCommission);
router.put('/commission', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.updateCommission);

module.exports = router;
