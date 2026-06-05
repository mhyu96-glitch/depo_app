const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { requireBranchAccess, requireRole } = require('../middleware/rbac');

router.get('/', authenticate, requireBranchAccess, ctrl.getAll);
router.get('/all-deliveries', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getAllDeliveries);
router.get('/courier/:courierId', authenticate, ctrl.getDeliveries);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, requireBranchAccess, ctrl.create);
router.post('/:id/request-delete', authenticate, ctrl.requestDelete);
router.patch('/:id/delivery-status', authenticate, ctrl.updateDeliveryStatus);
router.patch('/:id/claim', authenticate, ctrl.claimTask);

module.exports = router;
