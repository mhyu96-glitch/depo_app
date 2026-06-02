const router = require('express').Router();
const ctrl = require('../controllers/fleetController');
const { authenticate } = require('../middleware/auth');

router.get('/vehicles', authenticate, ctrl.getAllVehicles);
router.post('/vehicles', authenticate, ctrl.createVehicle);
router.get('/maintenance', authenticate, ctrl.getMaintenanceLogs);
router.post('/maintenance', authenticate, ctrl.createMaintenanceLog);

module.exports = router;
