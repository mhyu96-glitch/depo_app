const router = require('express').Router();
const ctrl = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.post('/reset', authenticate, ctrl.updateMaintenance);

module.exports = router;
