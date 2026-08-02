const { Wallet } = require('../models/wallet.model');
const { Transaction } = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');

async function createWallet(userId, session) {
  const [wallet] = await Wallet.create([{ userId }], { session });
  return wallet;
}

async function getWalletByUserId(userId) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
  return wallet;
}

async function creditWallet(walletId, userId, amount, type, description, relatedId, relatedModel, session) {
  const wallet = await Wallet.findByIdAndUpdate(
    walletId,
    { $inc: { balance: amount } },
    { new: true, session },
  );
  if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

  await Transaction.create(
    [{ walletId, userId, type, amount, balanceAfter: wallet.balance, relatedId, relatedModel, description }],
    { session },
  );

  return wallet;
}

async function debitWallet(walletId, userId, amount, type, description, relatedId, relatedModel, session) {
  const wallet = await Wallet.findById(walletId).session(session ?? null);
  if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
  if (wallet.balance < amount) throw new AppError(400, 'Số dư ví không đủ');

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

  const hireTxs = transactions.filter(
    (tx) =>
      (tx.type === 'jockey_hire_fee' || tx.type === 'jockey_hire_income')
      && tx.relatedId
      && /invitation/i.test(tx.description || ''),
  );

  if (hireTxs.length > 0) {
    const { JockeyInvitation } = require('../models/jockey_invitation.model');
    const ids = [...new Set(hireTxs.map((tx) => String(tx.relatedId)))];
    const invitations = await JockeyInvitation.find({ _id: { $in: ids } })
      .populate('horseId', 'name')
      .populate('raceId', 'name')
      .lean();
    const invMap = new Map(invitations.map((inv) => [String(inv._id), inv]));

    for (const tx of hireTxs) {
      const inv = invMap.get(String(tx.relatedId));
      const horseName = inv?.horseId?.name;
      if (!horseName) continue;
      const raceName = inv?.raceId?.name;
      const suffix = raceName ? ` — ${raceName}` : '';
      tx.description = tx.type === 'jockey_hire_fee'
        ? `Phí thuê kỵ sĩ cho ngựa ${horseName}${suffix}`
        : `Thu nhập thuê cưỡi ngựa ${horseName}${suffix}`;
    }
  }

  return { transactions, total, page, limit };
}

module.exports = { createWallet, getWalletByUserId, creditWallet, debitWallet, getTransactionHistory };
