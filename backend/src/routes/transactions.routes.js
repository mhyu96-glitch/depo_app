const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { requireBranchAccess } = require('../middleware/rbac');

router.get('/', authenticate, requireBranchAccess, ctrl.getAll);
router.get('/all-deliveries', authenticate, ctrl.getAllDeliveries);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, requireBranchAccess, ctrl.create);
router.get('/courier/:courierId', authenticate, ctrl.getDeliveries);
router.patch('/:id/delivery-status', authenticate, ctrl.updateDeliveryStatus);
router.patch('/:id/claim', authenticate, ctrl.claimTask);

module.exports = router;
