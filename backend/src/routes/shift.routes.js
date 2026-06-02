const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shiftController');
const { authenticate } = require('../middleware/auth');

router.get('/',           authenticate, ctrl.getAll);
router.get('/active',     authenticate, ctrl.getActive);
router.post('/open',      authenticate, ctrl.open);
router.put('/:id/close',  authenticate, ctrl.close);

module.exports = router;
