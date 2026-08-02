const mongoose = require('mongoose');
const { Race } = require('../models/race.model');
const { RaceResult } = require('../models/race_result.model');
const { Horse } = require('../models/horse.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { settleBetsWithSession } = require('./bet.service');
const { AppError } = require('../middleware/error.middleware');
const { POINTS_BY_GRADE, PRIZE_RATIO, GRADE_THRESHOLDS } = require('../config/constants');

function getUpgradedGrade(currentGrade, totalPoints) {
  const order = ['Maiden', 'G3', 'G2', 'G1'];
  let grade = currentGrade;
  for (const g of order) {
    if (totalPoints >= GRADE_THRESHOLDS[g]) grade = g;
  }
  return grade;
}

/**
 * Pay purse + career stats + settle bets. Idempotent via race.payoutSettledAt.
 * Call inside or outside session; if session omitted, creates one.
 */
async function settleOfficialPayouts(raceId, outerSession) {
  const ownSession = !outerSession;
  const session = outerSession || (await mongoose.startSession());
  if (ownSession) session.startTransaction();

  try {
    let raceQuery = Race.findById(raceId);
    if (session) raceQuery = raceQuery.session(session);
    const race = await raceQuery;
    if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
    if (race.status !== 'finished') {
      throw new AppError(400, 'Race phải finished trước khi settle official');
    }
    if (race.payoutSettledAt) {
      if (ownSession) await session.commitTransaction();
      return race;
    }

    let resultsQuery = RaceResult.find({ raceId, disqualified: { $ne: true } }).sort({ position: 1 });
    if (session) resultsQuery = resultsQuery.session(session);
    const results = await resultsQuery;

    if (results.length === 0) {
      // All disqualified
      race.status = 'cancelled';
      race.payoutSettledAt = new Date();
      await race.save({ session });

      let dqQuery = RaceResult.find({ raceId, disqualified: true });
      if (session) dqQuery = dqQuery.session(session);
      const dqResults = await dqQuery;
      for (const result of dqResults) {
        await Horse.findByIdAndUpdate(result.horseId, { $inc: { raceCount: 1 } }, { session });
      }

      await settleBetsWithSession(race._id, {}, race.name, session);

      if (ownSession) await session.commitTransaction();
      return race;
    }

    const positionGroups = {};
    for (const r of results) {
      if (!r.position) continue;
      if (!positionGroups[r.position]) positionGroups[r.position] = [];
      positionGroups[r.position].push(r);
    }

    const groupPayouts = {};
    for (const posStr of Object.keys(positionGroups)) {
      const pos = parseInt(posStr, 10);
      const count = positionGroups[pos].length;
      let totalPrize = 0;
      let totalPoints = 0;
      for (let i = 0; i < count; i++) {
        const virtualPos = pos + i;
        if (virtualPos <= PRIZE_RATIO.length) {
          totalPrize += Math.floor(race.purse * PRIZE_RATIO[virtualPos - 1]);
        }
        if (virtualPos <= (POINTS_BY_GRADE[race.grade]?.length ?? 0)) {
          totalPoints += POINTS_BY_GRADE[race.grade][virtualPos - 1];
        }
      }
      groupPayouts[pos] = {
        prizeAmount: Math.floor(totalPrize / count),
        pointsEarned: Math.floor(totalPoints / count),
      };
    }

    const positionMap = {};

    for (const result of results) {
      if (!result.position) continue;

      const { prizeAmount, pointsEarned } = groupPayouts[result.position] || { prizeAmount: 0, pointsEarned: 0 };

      result.prizeAmount = prizeAmount;
      result.pointsEarned = pointsEarned;
      await result.save({ session });

      if (prizeAmount > 0) {
        const ownerId = await resolveOwnerId(result, session);
        if (ownerId) {
          const ownerWallet = await Wallet.findOne({ userId: ownerId }).session(session);
          if (ownerWallet) {
            await walletService.creditWallet(
              ownerWallet._id,
              ownerId,
              prizeAmount,
              'prize_payout',
              `Tiền thưởng hạng ${result.position}: ${race.name}`,
              race._id,
              'Race',
              session,
            );
          }
        }
      }

      const incFields = { raceCount: 1, totalPoints: pointsEarned, totalEarnings: prizeAmount };
      if (result.position === 1) incFields.winCount = 1;

      const updatedHorse = await Horse.findByIdAndUpdate(
        result.horseId,
        { $inc: incFields },
        { new: true, session },
      );

      if (updatedHorse) {
        const newGrade = getUpgradedGrade(updatedHorse.currentGrade, updatedHorse.totalPoints);
        if (newGrade !== updatedHorse.currentGrade) {
          await Horse.findByIdAndUpdate(
            updatedHorse._id,
            { $set: { currentGrade: newGrade } },
            { session },
          );
        }
      }

      positionMap[result.horseId.toString()] = result.position;
    }

    // Also increment raceCount for DQ'd horses (no points/prize/win)
    let dqQuery = RaceResult.find({ raceId, disqualified: true });
    if (session) dqQuery = dqQuery.session(session);
    const dqResults = await dqQuery;
    for (const result of dqResults) {
      await Horse.findByIdAndUpdate(result.horseId, { $inc: { raceCount: 1 } }, { session });
    }

    await settleBetsWithSession(race._id, positionMap, race.name, session);

    race.isOfficial = true;
    race.payoutSettledAt = new Date();
    await race.save({ session });

    if (ownSession) await session.commitTransaction();
    return race;
  } catch (err) {
    if (ownSession) await session.abortTransaction();
    throw err;
  } finally {
    if (ownSession) session.endSession();
  }
}

async function resolveOwnerId(result, session) {
  const { Registration } = require('../models/registration.model');
  if (!result.registrationId) return null;
  let q = Registration.findById(result.registrationId).select('ownerId');
  if (session) q = q.session(session);
  const reg = await q;
  return reg?.ownerId || null;
}

module.exports = { settleOfficialPayouts, getUpgradedGrade };
