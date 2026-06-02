const { Router } = require('express');
const publicController = require('../controllers/public.controller');

const router = Router();

// No authentication required — landing page public data
router.get('/stats', publicController.getPlatformStats);

module.exports = router;
