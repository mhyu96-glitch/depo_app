const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsappController');
const { authenticate } = require('../middleware/auth');

router.post('/send-receipt',      authenticate, ctrl.sendReceipt);
router.post('/send-loyalty',      authenticate, ctrl.sendLoyaltyReward);
router.post('/blast-churn',       authenticate, ctrl.blastChurnRetarget);
router.get('/logs',               authenticate, ctrl.getLogs);

module.exports = router;
