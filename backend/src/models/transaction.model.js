const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'topup',
        'registration_fee',
        'registration_refund',
        'prize_payout',
        'bet_placed',
        'bet_payout',
        'bet_refund',
        'jockey_hire_fee',
        'jockey_hire_income',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String },
    description: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };
