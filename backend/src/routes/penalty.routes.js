const { Router } = require('express');
const penaltyController = require('../controllers/penalty.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);
router.get('/me', penaltyController.listMine);
router.post('/:id/pay', penaltyController.pay);

module.exports = router;
