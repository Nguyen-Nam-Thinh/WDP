const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

// Admin Dashboard routes
router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);

module.exports = router;
