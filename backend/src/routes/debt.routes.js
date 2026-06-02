const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/debtController');
const { authenticate } = require('../middleware/auth');

router.get('/',                   authenticate, ctrl.getAll);
router.post('/:id/pay',           authenticate, ctrl.recordPayment);
router.post('/:id/remind',        authenticate, ctrl.sendReminder);

module.exports = router;
