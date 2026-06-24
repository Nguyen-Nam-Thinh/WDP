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

async function getAdminRewards(req, res, next) {
  try {
    const rewards = await rewardService.getAdminRewards();
    sendSuccess(res, rewards);
  } catch (error) {
    next(error);
  }
}

async function createReward(req, res, next) {
  try {
    const reward = await rewardService.createReward(req.body);
    sendSuccess(res, reward, 201, 'Tạo phần thưởng thành công');
  } catch (error) {
    next(error);
  }
}

async function updateReward(req, res, next) {
  try {
    const reward = await rewardService.updateReward(req.params.id, req.body);
    sendSuccess(res, reward, 200, 'Cập nhật phần thưởng thành công');
  } catch (error) {
    next(error);
  }
}

async function deleteReward(req, res, next) {
  try {
    const result = await rewardService.deleteReward(req.params.id);
    sendSuccess(res, result.reward, 200, result.message);
  } catch (error) {
    next(error);
  }
}

async function uploadRewardImage(req, res, next) {
  try {
    if (!req.file) {
      return next(new Error('Vui lòng chọn file hình ảnh để upload'));
    }
    const result = await rewardService.uploadRewardImage(req.file.buffer);
    sendSuccess(res, result, 200, 'Upload ảnh thành công');
  } catch (error) {
    next(error);
  }
}

async function getAllRedemptions(req, res, next) {
  try {
    const redemptions = await rewardService.getAllRedemptions();
    sendSuccess(res, redemptions);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRewards,
  redeemReward,
  getMyRedemptions,
  getAdminRewards,
  createReward,
  updateReward,
  deleteReward,
  uploadRewardImage,
  getAllRedemptions
};
