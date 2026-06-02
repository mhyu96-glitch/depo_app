const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { requireBranchAccess } = require('../middleware/rbac');

router.get('/', authenticate, requireBranchAccess, ctrl.getAll);
router.get('/today', authenticate, ctrl.getTodayPresent);
router.post('/', authenticate, requireBranchAccess, ctrl.checkIn);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
