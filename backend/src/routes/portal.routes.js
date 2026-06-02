const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerPortalController');

// All routes are PUBLIC - no authentication required
router.get('/store-info',  ctrl.getStoreInfo);
router.post('/lookup',     ctrl.lookup);
router.post('/order',      ctrl.placeOrder);

module.exports = router;
