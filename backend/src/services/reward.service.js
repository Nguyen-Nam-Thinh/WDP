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
    if (count === 0 || hasMissingType) {
      await Reward.deleteMany({});
      const initialRewards = [
        {
          name: 'Voucher 50,000 VNĐ',
          description: 'Voucher giảm giá trực tiếp 50,000 VNĐ khi mua sắm tại cửa hàng đối tác.',
          coinsRequired: 50,
          imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
          stock: 100,
          isActive: true,
          type: 'voucher'
        },
        {
          name: 'Voucher 100,000 VNĐ',
          description: 'Voucher giảm giá trực tiếp 100,000 VNĐ áp dụng cho tất cả dịch vụ.',
          coinsRequired: 100,
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500',
          stock: 50,
          isActive: true,
          type: 'voucher'
        },
        {
          name: 'Áo thun Heritage Racing',
          description: 'Áo thun phiên bản giới hạn kỷ niệm giải đua Heritage Racing League.',
          coinsRequired: 200,
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          stock: 20,
          isActive: true,
          type: 'physical'
        },
        {
          name: 'Mũ lưỡi trai Racing Green',
          description: 'Mũ lưỡi trai thêu logo Racing cao cấp phong cách cổ điển.',
          coinsRequired: 150,
          imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
          stock: 30,
          isActive: true,
          type: 'physical'
        },
        {
          name: 'Vé VIP Xem Trực Tiếp',
          description: 'Vé mời VIP trải nghiệm xem đua ngựa thực tế tại khán đài A.',
          coinsRequired: 500,
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
    
    const costInVnd = reward.coinsRequired * 1000;
    if (wallet.balance < costInVnd) {
      throw new AppError(400, 'Số dư ví của bạn không đủ để đổi phần thưởng này');
    }

    // Debit VNĐ from wallet using the wallet service
    await walletService.debitWallet(
      wallet._id,
      userId,
      costInVnd,
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
        coinsSpent: costInVnd,
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

module.exports = {
  seedRewards,
  getRewards,
  redeemReward,
  getMyRedemptions
};
