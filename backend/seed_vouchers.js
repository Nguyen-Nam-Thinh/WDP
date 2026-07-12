const mongoose = require('mongoose');
const { Reward } = require('./src/models/reward.model');
require('dotenv').config();

const vouchers = [
  {
    name: 'Voucher x0.5 Dự Đoán',
    description: 'Bảo hiểm một nửa số tiền cược nếu thua hoặc nhân 0.5 tiền thưởng nếu thắng.',
    coinsRequired: 200,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2610/2610609.png',
    stock: 50,
    isActive: true,
    type: 'voucher',
    voucherType: 'bet_multiplier',
    rewardMultiplier: 0.5,
    maxPerUser: 5
  },
  {
    name: 'Voucher x0.75 Dự Đoán',
    description: 'Nhân 0.75 tiền thưởng dự đoán.',
    coinsRequired: 400,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2610/2610609.png',
    stock: 30,
    isActive: true,
    type: 'voucher',
    voucherType: 'bet_multiplier',
    rewardMultiplier: 0.75,
    maxPerUser: 3
  },
  {
    name: 'Voucher x1.0 Dự Đoán',
    description: 'Nhân gấp đôi tiền thưởng (x1.0 cơ bản) cho dự đoán đúng.',
    coinsRequired: 800,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2610/2610609.png',
    stock: 10,
    isActive: true,
    type: 'voucher',
    voucherType: 'bet_multiplier',
    rewardMultiplier: 1.0,
    maxPerUser: 1
  },
  {
    name: 'Đổi 100 Coin lấy 110 Coin',
    description: 'Nhận ngay 110 coin vào ví khi sử dụng mã voucher này. Dành cho thành viên may mắn lâu lâu có 1 lần.',
    coinsRequired: 100,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1490/1490853.png',
    stock: 20,
    isActive: true,
    type: 'voucher',
    voucherType: 'coin_exchange',
    exchangeReceiveCoins: 110,
    maxPerUser: 1
  },
  {
    name: 'Đổi 500 Coin lấy 550 Coin',
    description: 'Nhận ngay 550 coin vào ví. Giới hạn 2 lượt đổi mỗi người dùng.',
    coinsRequired: 500,
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1490/1490853.png',
    stock: 10,
    isActive: true,
    type: 'voucher',
    voucherType: 'coin_exchange',
    exchangeReceiveCoins: 550,
    maxPerUser: 2
  }
];

async function seedVouchers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Đã kết nối MongoDB. Đang thêm dữ liệu voucher...');
    
    for (const v of vouchers) {
      const result = await Reward.updateOne({ name: v.name }, { $set: v }, { upsert: true });
      if (result.upsertedCount > 0) {
        console.log(`Đã thêm mới: ${v.name}`);
      } else {
        console.log(`Đã cập nhật: ${v.name}`);
      }
    }

    console.log('Thêm dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu:', error);
    process.exit(1);
  }
}

seedVouchers();
