const { Wallet } = require('../models/wallet.model');
const { Transaction } = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');

async function createWallet(userId, session) {
  const [wallet] = await Wallet.create([{ userId }], { session });
  return wallet;
}

async function getWalletByUserId(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new AppError(404, 'Wallet not found');
  return wallet;
}

async function creditWallet(walletId, userId, amount, type, description, relatedId, relatedModel, session) {
  const wallet = await Wallet.findByIdAndUpdate(
    walletId,
    { $inc: { balance: amount } },
    { new: true, session },
  );
  if (!wallet) throw new AppError(404, 'Wallet not found');

  await Transaction.create(
    [{ walletId, userId, type, amount, balanceAfter: wallet.balance, relatedId, relatedModel, description }],
    { session },
  );

  return wallet;
}

async function debitWallet(walletId, userId, amount, type, description, relatedId, relatedModel, session) {
  const wallet = await Wallet.findById(walletId).session(session ?? null);
  if (!wallet) throw new AppError(404, 'Wallet not found');
  if (wallet.balance < amount) throw new AppError(400, 'Insufficient balance');

  wallet.balance -= amount;
  await wallet.save({ session });

  await Transaction.create(
    [{ walletId, userId, type, amount: -amount, balanceAfter: wallet.balance, relatedId, relatedModel, description }],
    { session },
  );

  return wallet;
}

async function getTransactionHistory(userId, page, limit) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments({ userId }),
  ]);
  return { transactions, total, page, limit };
}

module.exports = { createWallet, getWalletByUserId, creditWallet, debitWallet, getTransactionHistory };
