const router = require('express').Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/logs', authenticate, ctrl.getLogs);
router.post('/update', authenticate, ctrl.updateStock);

module.exports = router;
