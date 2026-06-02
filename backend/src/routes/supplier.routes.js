const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');

router.get('/suppliers',          authenticate, ctrl.getSuppliers);
router.post('/suppliers',         authenticate, ctrl.createSupplier);
router.put('/suppliers/:id',      authenticate, ctrl.updateSupplier);
router.get('/purchase-orders',    authenticate, ctrl.getPurchaseOrders);
router.post('/purchase-orders',   authenticate, ctrl.createPO);
router.put('/purchase-orders/:id',authenticate, ctrl.updatePOStatus);

module.exports = router;
