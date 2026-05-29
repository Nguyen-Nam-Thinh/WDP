const { Types } = require('mongoose');
const userService = require('../services/user.service');
const walletService = require('../services/wallet.service');
const { sendSuccess } = require('../utils/response');

async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user._id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    sendSuccess(res, user, 200, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

async function getMyWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletByUserId(new Types.ObjectId(req.user._id));
    sendSuccess(res, wallet);
  } catch (error) {
    next(error);
  }
}

async function getMyTransactions(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await walletService.getTransactionHistory(
      new Types.ObjectId(req.user._id),
      page,
      limit,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    const user = await userService.uploadAvatar(req.user._id, req.file.buffer);
    sendSuccess(res, user, 200, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe, updateMe, getMyWallet, getMyTransactions, uploadAvatar };
