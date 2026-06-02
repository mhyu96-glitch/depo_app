const router = require('express').Router();
const ctrl = require('../controllers/cashflowController');
const { authenticate } = require('../middleware/auth');
const { requireBranchAccess } = require('../middleware/rbac');

router.get('/', authenticate, requireBranchAccess, ctrl.getAll);
router.post('/', authenticate, requireBranchAccess, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
