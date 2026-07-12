const mongoose = require('mongoose');
const { Bet } = require('../models/bet.model');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { RaceResult } = require('../models/race_result.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const bettingOddsService = require('./betting-odds.service');
const { AppError } = require('../middleware/error.middleware');
const { PARIMUTUEL_CONFIG, CUTOFFS } = require('../config/constants');

const BETTABLE_STATUSES = ['open', 'closed', 'pre_check'];
const { rake, minMultiplier, maxMultiplier } = PARIMUTUEL_CONFIG;

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundOdds(value) {
  return Math.round(value * 100) / 100;
}

// ── placeBet ──────────────────────────────────────────────────────────────────

/**
 * Đặt cược vào 1 ngựa trong race.
 * Parimutuel Option B: multiplier = 0 lúc đặt, tính thực khi settle.
 */
async function placeBet(spectatorId, { raceId, horseId, amount, voucherCode }) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (!BETTABLE_STATUSES.includes(race.status)) {
    throw new AppError(400, `Không thể dự đoán cho cuộc đua đang ở trạng thái '${race.status}'`);
  }

  const bettingCutoff = new Date(race.scheduledTime.getTime() - CUTOFFS.bettingHours * 60 * 60 * 1000);
  if (new Date() > bettingCutoff) {
    throw new AppError(400, 'Đã qua thời hạn dự đoán cho cuộc đua này');
  }

  // Ngựa phải đang đăng ký active trong race này
  const registration = await Registration.findOne({ raceId, horseId, status: 'active' });
  if (!registration) throw new AppError(400, 'Ngựa chưa đăng ký tham gia cuộc đua này');

  if (amount < 1) throw new AppError(400, 'Số tiền dự đoán tối thiểu là 1');

  // Tính odds ước tính tại thời điểm đặt (chỉ để hiển thị, không lock)
  const estimatedMultiplier = await bettingOddsService.calcEstimatedMultiplier(raceId, horseId);

  const session = await mongoose.startSession();
  session.startTransaction();

  let bet;
  try {
    const wallet = await Wallet.findOne({ userId: spectatorId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

    await walletService.debitWallet(
      wallet._id, spectatorId, amount,
      'bet_placed',
      `Dự đoán ngựa trong cuộc đua ${race.name} (odds ước tính: x${estimatedMultiplier})`,
      null, 'Race', session,
    );

    let voucherId = null;
    if (voucherCode) {
      const { Redemption } = require('../models/redemption.model');
      const redemption = await Redemption.findOne({
        voucherCode,
        userId: spectatorId,
        isUsed: false,
        status: 'completed'
      }).populate('rewardId').session(session);

      if (!redemption) {
        throw new AppError(400, 'Mã Voucher không hợp lệ hoặc đã được sử dụng');
      }

      if (redemption.rewardId.voucherType !== 'bet_multiplier') {
        throw new AppError(400, 'Voucher này không thể áp dụng cho dự đoán');
      }

      redemption.isUsed = true;
      await redemption.save({ session });
      voucherId = redemption._id;
    }

    // multiplier = 0: sẽ được cập nhật thực khi race kết thúc
    [bet] = await Bet.create(
      [{ spectatorId, raceId, horseId, amount, multiplier: 0, voucherId }],
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  return Bet.findById(bet._id)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed currentGrade')
    .then(async (placedBet) => {
      bettingOddsService.emitPoolUpdated(raceId).catch(() => {});
      // Đính kèm estimated multiplier để FE hiển thị (không lưu DB)
      const result = placedBet.toObject();
      result.estimatedMultiplier = estimatedMultiplier;
      return result;
    });
}

// ── getMyBets ─────────────────────────────────────────────────────────────────

async function getMyBets(userId, role, { page = 1, limit = 20, status, raceId } = {}) {
  const filter = role === 'admin' ? {} : { spectatorId: userId };
  if (status) filter.status = status;
  if (raceId) filter.raceId = raceId;

  const skip = (page - 1) * limit;
  const [bets, total] = await Promise.all([
    Bet.find(filter)
      .populate('spectatorId', 'fullName email')
      .populate('raceId', 'name grade scheduledTime status tournamentId')
      .populate('horseId', 'name breed currentGrade imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Bet.countDocuments(filter),
  ]);

  return { bets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── getBetById ────────────────────────────────────────────────────────────────

async function getBetById(betId, spectatorId, role) {
  const bet = await Bet.findById(betId)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed currentGrade');
  if (!bet) throw new AppError(404, 'Không tìm thấy dự đoán');

  if (role !== 'admin' && bet.spectatorId.toString() !== spectatorId) {
    throw new AppError(403, 'Bạn không có quyền truy cập');
  }
  return bet;
}

// ── cancelBet ─────────────────────────────────────────────────────────────────

async function cancelBet(betId, spectatorId) {
  const bet = await Bet.findOne({ _id: betId, spectatorId });
  if (!bet) throw new AppError(404, 'Không tìm thấy dự đoán hoặc bạn không có quyền truy cập');
  if (bet.status !== 'pending') throw new AppError(400, `Không thể hủy dự đoán đang ở trạng thái ${bet.status}`);

  const race = await Race.findById(bet.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const bettingCutoff = new Date(race.scheduledTime.getTime() - CUTOFFS.bettingHours * 60 * 60 * 1000);
  if (new Date() > bettingCutoff) {
    throw new AppError(400, 'Không thể hủy dự đoán sau khi đã qua thời hạn dự đoán');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId: spectatorId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

    await walletService.creditWallet(
      wallet._id, spectatorId, bet.amount,
      'bet_refund',
      `Hoàn tiền: hủy dự đoán cuộc đua ${race.name}`,
      bet._id, 'Bet', session,
    );

    bet.status = 'cancelled';
    await bet.save({ session });

    if (bet.voucherId) {
      const { Redemption } = require('../models/redemption.model');
      await Redemption.findByIdAndUpdate(bet.voucherId, { $set: { isUsed: false } }, { session });
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  return bet.populate('raceId', 'name grade scheduledTime').then(async (cancelled) => {
    bettingOddsService.emitPoolUpdated(bet.raceId.toString()).catch(() => {});
    return cancelled;
  });
}

// ── getRaceBets ───────────────────────────────────────────────────────────────

async function getRaceBets(raceId, { page = 1, limit = 50 } = {}) {
  const skip = (page - 1) * limit;
  const [bets, total] = await Promise.all([
    Bet.find({ raceId })
      .populate('spectatorId', 'fullName email')
      .populate('horseId', 'name breed currentGrade')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Bet.countDocuments({ raceId }),
  ]);
  return { bets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── settleBets ────────────────────────────────────────────────────────────────

/**
 * Settle bets theo parimutuel:
 * 1. Tìm ngựa về nhất từ RaceResult
 * 2. Tính totalPool và amountOnWinner
 * 3. payoutPool = totalPool × (1 - rake)
 * 4. Mỗi người thắng nhận: (bet.amount / amountOnWinner) × payoutPool
 * 5. multiplier thực = payoutPool / amountOnWinner
 *
 * Edge case: không ai cược vào ngựa thắng → hoàn tiền toàn bộ pending bets
 */
async function settleBets(raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'finished') throw new AppError(400, 'Cuộc đua phải kết thúc trước khi thanh toán dự đoán');

  const results = await RaceResult.find({ raceId }).sort({ position: 1 });
  if (results.length === 0) throw new AppError(400, 'Chưa có kết quả cuộc đua. Không thể thanh toán dự đoán.');

  const winnerResult = results.find((r) => r.position === 1);
  if (!winnerResult) throw new AppError(400, 'Không tìm được ngựa về nhất');

  const pendingBets = await Bet.find({ raceId, status: 'pending' }).populate({ path: 'voucherId', populate: { path: 'rewardId' } });
  if (pendingBets.length === 0) return { settled: 0, message: 'Không có dự đoán chờ thanh toán' };

  // Tính pool
  const totalPool = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const payoutPool = Math.floor(totalPool * (1 - rake));
  const winnerHorseId = winnerResult.horseId.toString();

  const winnerBets = pendingBets.filter((b) => b.horseId.toString() === winnerHorseId);
  const amountOnWinner = winnerBets.reduce((sum, b) => sum + b.amount, 0);

  const session = await mongoose.startSession();
  session.startTransaction();

  let wonCount = 0;
  let lostCount = 0;

  try {
    if (amountOnWinner === 0) {
      // Không ai cược vào ngựa thắng → hoàn tiền tất cả
      for (const bet of pendingBets) {
        const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
        if (wallet) {
          await walletService.creditWallet(
            wallet._id, bet.spectatorId, bet.amount,
            'bet_refund',
            `Hoàn tiền: không ai cược vào ngựa thắng cuộc đua ${race.name}`,
            bet._id, 'Bet', session,
          );
        }
        bet.status = 'refunded';
        bet.settledAt = new Date();
        await bet.save({ session });

        if (bet.voucherId) {
          const { Redemption } = require('../models/redemption.model');
          await Redemption.findByIdAndUpdate(bet.voucherId._id, { $set: { isUsed: false } }, { session });
        }
      }
    } else {
      // Tính multiplier thực
      const actualMultiplier = roundOdds(clamp(payoutPool / amountOnWinner, minMultiplier, maxMultiplier));

      for (const bet of pendingBets) {
        const isWinner = bet.horseId.toString() === winnerHorseId;

        if (isWinner) {
          let payout = Math.floor((bet.amount / amountOnWinner) * payoutPool);
          
          if (bet.voucherId && bet.voucherId.rewardId && bet.voucherId.rewardId.voucherType === 'bet_multiplier') {
            const multiplier = bet.voucherId.rewardId.rewardMultiplier || 0;
            payout = Math.floor(payout * (1 + multiplier));
          }

          const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
          if (wallet) {
            await walletService.creditWallet(
              wallet._id, bet.spectatorId, payout,
              'bet_payout',
              `Thắng dự đoán cuộc đua ${race.name} (x${actualMultiplier})`,
              bet._id, 'Bet', session,
            );
          }
          bet.status = 'won';
          bet.payoutAmount = payout;
          bet.multiplier = actualMultiplier;
          wonCount++;
        } else {
          bet.status = 'lost';
          lostCount++;
        }
        bet.settledAt = new Date();
        await bet.save({ session });
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  return {
    settled: pendingBets.length,
    won: wonCount,
    lost: lostCount,
    totalPool,
    payoutPool,
    winnerHorseId,
  };
}

// ── settleBetsWithSession ─────────────────────────────────────────────────────

/**
 * Settle bets trong external MongoDB session (từ race simulation).
 * positionMap: { [horseId]: position }
 */
async function settleBetsWithSession(raceId, positionMap, raceName, session) {
  const pendingBets = await Bet.find({ raceId, status: 'pending' })
    .populate({ path: 'voucherId', populate: { path: 'rewardId' } })
    .session(session);
  if (!pendingBets.length) return 0;

  // Tìm ngựa về nhất
  const winnerHorseId = Object.keys(positionMap).find(
    (hId) => positionMap[hId] === 1
  );

  const totalPool = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const payoutPool = Math.floor(totalPool * (1 - rake));

  const winnerBets = winnerHorseId
    ? pendingBets.filter((b) => b.horseId.toString() === winnerHorseId)
    : [];
  const amountOnWinner = winnerBets.reduce((sum, b) => sum + b.amount, 0);

  if (amountOnWinner === 0) {
    // Hoàn tiền tất cả
    for (const bet of pendingBets) {
      const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
      if (wallet) {
        await walletService.creditWallet(
          wallet._id, bet.spectatorId, bet.amount,
          'bet_refund',
          `Hoàn tiền: không ai cược vào ngựa thắng cuộc đua ${raceName}`,
          bet._id, 'Bet', session,
        );
      }
      bet.status = 'refunded';
      bet.settledAt = new Date();
      await bet.save({ session });

      if (bet.voucherId) {
        const { Redemption } = require('../models/redemption.model');
        await Redemption.findByIdAndUpdate(bet.voucherId._id, { $set: { isUsed: false } }, { session });
      }
    }
    return pendingBets.length;
  }

  const actualMultiplier = roundOdds(clamp(payoutPool / amountOnWinner, minMultiplier, maxMultiplier));

  for (const bet of pendingBets) {
    const isWinner = winnerHorseId && bet.horseId.toString() === winnerHorseId;

    if (isWinner) {
      let payout = Math.floor((bet.amount / amountOnWinner) * payoutPool);
      
      if (bet.voucherId && bet.voucherId.rewardId && bet.voucherId.rewardId.voucherType === 'bet_multiplier') {
        const multiplier = bet.voucherId.rewardId.rewardMultiplier || 0;
        payout = Math.floor(payout * (1 + multiplier));
      }

      const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
      if (wallet) {
        await walletService.creditWallet(
          wallet._id, bet.spectatorId, payout,
          'bet_payout',
          `Thắng dự đoán cuộc đua ${raceName} (x${actualMultiplier})`,
          bet._id, 'Bet', session,
        );
      }
      bet.status = 'won';
      bet.payoutAmount = payout;
      bet.multiplier = actualMultiplier;
    } else {
      bet.status = 'lost';
    }
    bet.settledAt = new Date();
    await bet.save({ session });
  }

  return pendingBets.length;
}

// ── refundRaceBets ────────────────────────────────────────────────────────────

async function refundRaceBets(raceId, session) {
  const pendingBets = await Bet.find({ raceId, status: 'pending' }).session(session);
  for (const bet of pendingBets) {
    const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
    if (wallet) {
      const race = await Race.findById(raceId).session(session);
      await walletService.creditWallet(
        wallet._id, bet.spectatorId, bet.amount,
        'bet_refund',
        `Hoàn tiền: cuộc đua bị hủy (${race?.name || raceId})`,
        bet._id, 'Bet', session,
      );
    }
    bet.status = 'refunded';
    bet.settledAt = new Date();
    await bet.save({ session });

    if (bet.voucherId) {
      const { Redemption } = require('../models/redemption.model');
      await Redemption.findByIdAndUpdate(bet.voucherId, { $set: { isUsed: false } }, { session });
    }
  }
  return pendingBets.length;
}

module.exports = {
  placeBet,
  getMyBets,
  getBetById,
  cancelBet,
  getRaceBets,
  settleBets,
  settleBetsWithSession,
  refundRaceBets,
  getRaceBettingOdds: bettingOddsService.getRaceBettingOdds,
};
