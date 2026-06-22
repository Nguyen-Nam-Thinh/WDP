const mongoose = require('mongoose');
const { stripe } = require('../config/stripe');
const { env } = require('../config/env');
const { Wallet } = require('../models/wallet.model');
const { Transaction } = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');

// Quy ước: 1 coin = 1.000 VND. VND là zero-decimal currency của Stripe
// nên unit_amount = số tiền VND thật (KHÔNG nhân 100).
const COIN_TO_VND = 1000;

function firstClientUrl() {
  return (env.CLIENT_URL || '').split(',')[0] || 'http://localhost:5173';
}

async function createTopupSession(userId, coins) {
  if (!coins || coins <= 0) throw new AppError(400, 'Số coin không hợp lệ');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'vnd',
          product_data: { name: `Nạp ${coins} coin` },
          unit_amount: coins * COIN_TO_VND,
        },
        quantity: 1,
      },
    ],
    metadata: { userId: String(userId), coins: String(coins) },
    success_url: `${firstClientUrl()}/wallet?topup=success`,
    cancel_url: `${firstClientUrl()}/wallet?topup=cancel`,
  });

  return { url: session.url, sessionId: session.id };
}

// Gọi từ webhook khi sự kiện checkout.session.completed về.
// Idempotent: unique index trên stripeSessionId chặn double-credit khi Stripe retry.
async function handleCheckoutCompleted(checkoutSession) {
  const { userId, coins } = checkoutSession.metadata || {};
  const coinAmount = parseInt(coins, 10);
  if (!userId || !coinAmount) return;

  const existed = await Transaction.findOne({ stripeSessionId: checkoutSession.id });
  if (existed) return;

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: coinAmount } },
        { new: true, session: dbSession },
      );
      if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

      await Transaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            type: 'topup',
            amount: coinAmount,
            balanceAfter: wallet.balance,
            description: `Nạp ${coinAmount} coin qua Stripe`,
            stripeSessionId: checkoutSession.id,
          },
        ],
        { session: dbSession },
      );
    });
  } finally {
    await dbSession.endSession();
  }
}

module.exports = { createTopupSession, handleCheckoutCompleted };
