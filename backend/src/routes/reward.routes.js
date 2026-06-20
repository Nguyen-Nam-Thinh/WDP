const { Router } = require('express');
const rewardController = require('../controllers/reward.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', rewardController.getRewards);
router.post('/:id/redeem', rewardController.redeemReward);
router.get('/my-redemptions', rewardController.getMyRedemptions);

module.exports = router;
