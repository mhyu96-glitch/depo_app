const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAll);
router.get('/stats', authenticate, ctrl.getStats);
router.post('/', authenticate, ctrl.create);

module.exports = router;
