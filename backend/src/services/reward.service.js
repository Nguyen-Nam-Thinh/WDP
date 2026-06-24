const mongoose = require('mongoose');
const { Reward } = require('../models/reward.model');
const { Redemption } = require('../models/redemption.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { AppError } = require('../middleware/error.middleware');

function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function seedRewards() {
  try {
    const count = await Reward.countDocuments();
    const hasMissingType = await Reward.findOne({ type: { $exists: false } });
    const hasOldCoinsFormat = await Reward.findOne({ coinsRequired: { $lt: 1000 } });
    if (count === 0 || hasMissingType || hasOldCoinsFormat) {
      await Reward.deleteMany({});
      const initialRewards = [
        {
          name: 'Voucher 50.000 coins',
          description: 'Voucher trị giá 50.000 coins dùng để thanh toán hoặc sử dụng dịch vụ.',
          coinsRequired: 50000,
          imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
          stock: 100,
          isActive: true,
          type: 'voucher'
        },
        {
          name: 'Voucher 100.000 coins',
          description: 'Voucher trị giá 100.000 coins áp dụng cho tất cả dịch vụ.',
          coinsRequired: 100000,
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500',
          stock: 50,
          isActive: true,
          type: 'voucher'
        },
        {
          name: 'Áo thun Heritage Racing',
          description: 'Áo thun phiên bản giới hạn kỷ niệm giải đua Heritage Racing League. Trị giá 200.000 coins.',
          coinsRequired: 200000,
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          stock: 20,
          isActive: true,
          type: 'physical'
        },
        {
          name: 'Mũ lưỡi trai Racing Green',
          description: 'Mũ lưỡi trai thêu logo Racing cao cấp phong cách cổ điển. Trị giá 150.000 coins.',
          coinsRequired: 150000,
          imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
          stock: 30,
          isActive: true,
          type: 'physical'
        },
        {
          name: 'Vé VIP Xem Trực Tiếp',
          description: 'Vé mời VIP trải nghiệm xem đua ngựa thực tế tại khán đài A. Trị giá 500.000 coins.',
          coinsRequired: 500000,
          imageUrl: 'https://images.unsplash.com/photo-1503023344727-83c98dc12ae9?w=500',
          stock: 5,
          isActive: true,
          type: 'physical'
        }
      ];
      await Reward.create(initialRewards);
      console.log('Seeded initial rewards successfully.');
    }
  } catch (error) {
    console.error('Error seeding rewards:', error);
  }
}

async function getRewards() {
  return Reward.find({ isActive: true, stock: { $gt: 0 } });
}

async function redeemReward(userId, rewardId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reward = await Reward.findById(rewardId).session(session);
    if (!reward) throw new AppError(404, 'Không tìm thấy phần thưởng');
    if (!reward.isActive) throw new AppError(400, 'Phần thưởng này hiện không khả dụng');
    if (reward.stock <= 0) throw new AppError(400, 'Phần thưởng này đã hết hàng');

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví của bạn');
    
    const cost = reward.coinsRequired;
    if (wallet.balance < cost) {
      throw new AppError(400, 'Số dư ví của bạn không đủ để đổi phần thưởng này');
    }

    // Debit coins from wallet using the wallet service
    await walletService.debitWallet(
      wallet._id,
      userId,
      cost,
      'reward_redeem',
      `Đổi phần thưởng: ${reward.name}`,
      reward._id,
      'Reward',
      session
    );

    // Decrement stock
    reward.stock -= 1;
    await reward.save({ session });

    const voucherCode = generateVoucherCode();

    // Create redemption record
    const [redemption] = await Redemption.create(
      [{
        userId,
        rewardId,
        coinsSpent: cost,
        status: 'completed',
        voucherCode
      }],
      { session }
    );

    await session.commitTransaction();

    return Redemption.findById(redemption._id)
      .populate('rewardId', 'name description imageUrl coinsRequired type')
      .session(null);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function getMyRedemptions(userId) {
  return Redemption.find({ userId })
    .populate('rewardId', 'name description imageUrl coinsRequired type')
    .sort({ createdAt: -1 });
}

const cloudinaryService = require('./cloudinary.service');

async function getAdminRewards() {
  return Reward.find({}).sort({ createdAt: -1 });
}

async function createReward(rewardData) {
  return Reward.create(rewardData);
}

async function updateReward(id, rewardData) {
  const reward = await Reward.findByIdAndUpdate(id, rewardData, { new: true, runValidators: true });
  if (!reward) throw new AppError(404, 'Không tìm thấy phần thưởng');
  return reward;
}

async function deleteReward(id) {
  const hasRedemptions = await Redemption.exists({ rewardId: id });
  if (hasRedemptions) {
    const reward = await Reward.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!reward) throw new AppError(404, 'Không tìm thấy phần thưởng');
    return { success: true, message: 'Phần thưởng đã được chuyển sang ngừng hoạt động do đã có người quy đổi.', reward };
  } else {
    const reward = await Reward.findByIdAndDelete(id);
    if (!reward) throw new AppError(404, 'Không tìm thấy phần thưởng');
    return { success: true, message: 'Đã xóa phần thưởng thành công.', reward };
  }
}

async function uploadRewardImage(fileBuffer) {
  const { url } = await cloudinaryService.uploadSingle(fileBuffer, 'hrtms/rewards');
  return { imageUrl: url };
}

async function getAllRedemptions() {
  return Redemption.find({})
    .populate('userId', 'fullName email')
    .populate('rewardId', 'name description imageUrl coinsRequired type')
    .sort({ createdAt: -1 });
}

module.exports = {
  seedRewards,
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
