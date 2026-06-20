const mongoose = require('mongoose');
const { Schema } = mongoose;

const redemptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
    coinsSpent: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
    voucherCode: { type: String },
  },
  { timestamps: true },
);

redemptionSchema.index({ userId: 1 });

const Redemption = mongoose.model('Redemption', redemptionSchema);

module.exports = { Redemption };
