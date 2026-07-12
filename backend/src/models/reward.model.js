const mongoose = require('mongoose');
const { Schema } = mongoose;

const rewardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    coinsRequired: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    stock: { type: Number, required: true, min: 0, default: 10 },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['voucher', 'physical'], default: 'voucher' },
    voucherType: { type: String, enum: ['external', 'bet_multiplier', 'coin_exchange'], default: 'external' },
    rewardMultiplier: { type: Number },
    exchangeReceiveCoins: { type: Number },
    maxPerUser: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = { Reward };
