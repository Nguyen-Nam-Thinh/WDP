const mongoose = require('mongoose');

const betSchema = new mongoose.Schema(
  {
    spectatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    // betType removed — parimutuel: chỉ 1 loại cược (đặt vào ngựa về nhất)
    amount: { type: Number, required: true, min: 1 },
    // multiplier = 0 lúc đặt, tính thực sau khi race kết thúc (parimutuel)
    multiplier: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'cancelled', 'refunded'],
      default: 'pending',
    },
    payoutAmount: { type: Number, default: 0, min: 0 },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

betSchema.index({ spectatorId: 1, createdAt: -1 });
betSchema.index({ raceId: 1, status: 1 });
betSchema.index({ raceId: 1, horseId: 1 });

const Bet = mongoose.model('Bet', betSchema);

module.exports = { Bet };
