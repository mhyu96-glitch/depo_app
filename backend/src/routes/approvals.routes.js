const router = require('express').Router();
const ctrl = require('../controllers/transactionApprovalController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Kasir request approval
router.post('/request-edit',   authenticate, requireRole('kasir'), ctrl.requestEditApproval);
router.post('/request-delete', authenticate, requireRole('kasir'), ctrl.requestDeleteApproval);

// Admin process approval
router.post('/process', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.processApproval);

// Get approvals
router.get('/pending',  authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getPendingApprovals);
router.get('/history/:transaction_id', authenticate, ctrl.getApprovalHistory);

module.exports = router;
