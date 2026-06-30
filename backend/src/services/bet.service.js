const mongoose = require('mongoose');
const { Bet } = require('../models/bet.model');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { RaceResult } = require('../models/race_result.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const bettingOddsService = require('./betting-odds.service');
const { AppError } = require('../middleware/error.middleware');
const { BET_ODDS_CONFIG, CUTOFFS } = require('../config/constants');

const BETTABLE_STATUSES = ['open', 'closed', 'pre_check'];
const BET_TYPES = Object.keys(BET_ODDS_CONFIG.baseOdds);

async function placeBet(spectatorId, { raceId, horseId, betType, amount }) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (!BETTABLE_STATUSES.includes(race.status)) {
    throw new AppError(400, `Không thể dự đoán cho cuộc đua đang ở trạng thái '${race.status}'`);
  }

  const bettingCutoff = new Date(race.scheduledTime.getTime() - CUTOFFS.bettingHours * 60 * 60 * 1000);
  if (new Date() > bettingCutoff) {
    throw new AppError(400, 'Đã qua thời hạn dự đoán cho cuộc đua này');
  }

  if (!BET_TYPES.includes(betType)) {
    throw new AppError(400, `Loại dự đoán không hợp lệ: ${betType}`);
  }

  // Horse must be actively registered in this race
  const registration = await Registration.findOne({ raceId, horseId, status: 'active' });
  if (!registration) throw new AppError(400, 'Ngựa chưa đăng ký tham gia cuộc đua này');

  if (amount < 1) throw new AppError(400, 'Số tiền dự đoán tối thiểu là 1');

  const multiplier = await bettingOddsService.calcLockedMultiplier(raceId, horseId, betType);

  const session = await mongoose.startSession();
  session.startTransaction();

  let bet;
  try {
    const wallet = await Wallet.findOne({ userId: spectatorId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

    await walletService.debitWallet(
      wallet._id, spectatorId, amount,
      'bet_placed',
      `Dự đoán: ${betType} vào ngựa trong cuộc đua ${race.name}`,
      null, 'Race', session,
    );

    [bet] = await Bet.create(
      [{ spectatorId, raceId, horseId, betType, amount, multiplier }],
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
      return placedBet;
    });
}

async function getMyBets(userId, role, { page = 1, limit = 20, status, raceId } = {}) {
  // Admin sees all bets; spectator only sees their own
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

async function settleBets(raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'finished') throw new AppError(400, 'Cuộc đua phải kết thúc trước khi thanh toán dự đoán');

  const results = await RaceResult.find({ raceId }).sort({ position: 1 });
  if (results.length === 0) throw new AppError(400, 'Chưa có kết quả cuộc đua. Không thể thanh toán dự đoán.');

  // Build a map: horseId → position
  const positionMap = {};
  results.forEach(r => { positionMap[r.horseId.toString()] = r.position; });

  const pendingBets = await Bet.find({ raceId, status: 'pending' });
  if (pendingBets.length === 0) return { settled: 0, message: 'Không có dự đoán chờ thanh toán' };

  const session = await mongoose.startSession();
  session.startTransaction();

  let wonCount = 0;
  let lostCount = 0;

  try {
    for (const bet of pendingBets) {
      const pos = positionMap[bet.horseId.toString()];
      let won = false;

      if (pos !== undefined) {
        if (bet.betType === 'win' && pos === 1) won = true;
        else if (bet.betType === 'place' && pos <= 2) won = true;
        else if (bet.betType === 'show' && pos <= 3) won = true;
      }

      if (won) {
        const payout = Math.floor(bet.amount * bet.multiplier);
        const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
        if (wallet) {
          await walletService.creditWallet(
            wallet._id, bet.spectatorId, payout,
            'bet_payout',
            `Thắng dự đoán: ${bet.betType} cuộc đua ${race.name}`,
            bet._id, 'Bet', session,
          );
        }
        bet.status = 'won';
        bet.payoutAmount = payout;
        wonCount++;
      } else {
        bet.status = 'lost';
        lostCount++;
      }
      bet.settledAt = new Date();
      await bet.save({ session });
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  return { settled: pendingBets.length, won: wonCount, lost: lostCount };
}

// Settle bets within an external MongoDB session (called from race simulation transaction)
async function settleBetsWithSession(raceId, positionMap, raceName, session) {
  const pendingBets = await Bet.find({ raceId, status: 'pending' }).session(session);

  for (const bet of pendingBets) {
    const pos = positionMap[bet.horseId.toString()];
    let won = false;

    if (pos !== undefined) {
      if (bet.betType === 'win' && pos === 1) won = true;
      else if (bet.betType === 'place' && pos <= 2) won = true;
      else if (bet.betType === 'show' && pos <= 3) won = true;
    }

    if (won) {
      const payout = Math.floor(bet.amount * bet.multiplier);
      const wallet = await Wallet.findOne({ userId: bet.spectatorId }).session(session);
      if (wallet) {
        await walletService.creditWallet(
          wallet._id, bet.spectatorId, payout,
          'bet_payout',
          `Thắng: ${bet.betType} cuộc đua ${raceName}`,
          bet._id, 'Bet', session,
        );
      }
      bet.status = 'won';
      bet.payoutAmount = payout;
    } else {
      bet.status = 'lost';
    }
    bet.settledAt = new Date();
    await bet.save({ session });
  }

  return pendingBets.length;
}

// Refund all pending bets when race is cancelled
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
  }
  return pendingBets.length;
}

module.exports = { placeBet, getMyBets, getBetById, cancelBet, getRaceBets, settleBets, settleBetsWithSession, refundRaceBets, getRaceBettingOdds: bettingOddsService.getRaceBettingOdds };
