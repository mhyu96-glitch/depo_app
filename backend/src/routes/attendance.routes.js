const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireBranchAccess } = require('../middleware/rbac');

// Check-in/out dengan face recognition
router.post('/checkin',  authenticate, requireBranchAccess, ctrl.checkIn);
router.post('/checkout', authenticate, ctrl.checkOut);

// Get attendance
router.get('/today',   authenticate, ctrl.getTodayAttendance);
router.get('/history', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.getAttendanceHistory);
router.get('/',        authenticate, requireBranchAccess, ctrl.getAttendanceHistory); // Alias

// Face recognition
router.post('/register-face',   authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.registerFace);
router.get('/face/:courier_id', authenticate, ctrl.getCourierFace);

// Delete (admin only)
router.delete('/:id', authenticate, requireRole('admin', 'branch_admin', 'superadmin'), ctrl.deleteAttendance);

module.exports = router;
