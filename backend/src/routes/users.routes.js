const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/',      authenticate, requireRole('admin'), ctrl.getAll);
router.post('/',     authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',   authenticate, requireRole('admin'), ctrl.update);
router.delete('/:id',authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
