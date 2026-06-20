const rewardService = require('../services/reward.service');
const { sendSuccess } = require('../utils/response');

async function getRewards(req, res, next) {
  try {
    const rewards = await rewardService.getRewards();
    sendSuccess(res, rewards);
  } catch (error) {
    next(error);
  }
}

async function redeemReward(req, res, next) {
  try {
    const redemption = await rewardService.redeemReward(req.user._id, req.params.id);
    sendSuccess(res, redemption, 201, 'Đổi quà thành công');
  } catch (error) {
    next(error);
  }
}

async function getMyRedemptions(req, res, next) {
  try {
    const redemptions = await rewardService.getMyRedemptions(req.user._id);
    sendSuccess(res, redemptions);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRewards,
  redeemReward,
  getMyRedemptions
};
