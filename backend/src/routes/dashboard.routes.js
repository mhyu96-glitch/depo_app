const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/widgets',           authenticate, ctrl.getWidgets);
router.get('/sales-trend',       authenticate, ctrl.getMonthlySalesTrend);
router.get('/daily-sales-trend', authenticate, ctrl.getDailySalesTrend);
router.get('/branch-comparison', authenticate, ctrl.getBranchComparison);
router.get('/ai-projection',     authenticate, ctrl.getAIProjection);
router.get('/business-health',   authenticate, ctrl.getBusinessHealth);

module.exports = router;
