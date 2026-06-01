const mongoose = require('mongoose');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { RaceResult } = require('../models/race_result.model');
const { Horse } = require('../models/horse.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { settleBetsWithSession, refundRaceBets } = require('./bet.service');
const { getIO } = require('../sockets');
const {
  POINTS_BY_GRADE,
  PRIZE_RATIO,
  GRADE_THRESHOLDS,
  AI_CONFIG,
} = require('../config/constants');

// Box-Muller Gaussian noise
function gaussianNoise(sigma = 1) {
  let u1, u2;
  do { u1 = Math.random(); } while (u1 === 0);
  do { u2 = Math.random(); } while (u2 === 0);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

// Win probability score per CLAUDE.md formula
function calcScore(horse, jockeyUser) {
  const { weights, gradeWeights } = AI_CONFIG.winProbability;

  const horseWinRate = horse.raceCount > 0 ? horse.winCount / horse.raceCount : 0;
  const gradeWeight = gradeWeights[horse.currentGrade] ?? 0.25;
  const normalizedPoints = Math.min(horse.totalPoints / 100, 1);

  const jp = jockeyUser?.jockeyProfile;
  const jockeyWinRate = jp?.raceCount > 0 ? jp.winCount / jp.raceCount : 0;

  return (
    weights.horseWinRate * horseWinRate +
    weights.gradeWeight * gradeWeight +
    weights.pointsWeight * normalizedPoints +
    weights.jockeyWinRate * jockeyWinRate
  );
}

// Grade upgrade only (never downgrade) per business rules
function getUpgradedGrade(currentGrade, totalPoints) {
  const order = ['Maiden', 'G3', 'G2', 'G1'];
  const currentIdx = order.indexOf(currentGrade);
  if (totalPoints >= GRADE_THRESHOLDS.G1 && currentIdx < 3) return 'G1';
  if (totalPoints >= GRADE_THRESHOLDS.G2 && currentIdx < 2) return 'G2';
  if (totalPoints >= GRADE_THRESHOLDS.G3 && currentIdx < 1) return 'G3';
  return currentGrade;
}

const RACE_DURATION_MS = 30_000;

// Atomic DB write: results + prizes + points + grade upgrades + bet settlement
async function finalizeRace(race, ordered) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const positionMap = {};

    for (const entry of ordered) {
      const { registration, position, finishTime } = entry;

      const prizeAmount =
        position <= PRIZE_RATIO.length
          ? Math.floor(race.purse * PRIZE_RATIO[position - 1])
          : 0;
      const pointsEarned =
        position <= (POINTS_BY_GRADE[race.grade]?.length ?? 0)
          ? POINTS_BY_GRADE[race.grade][position - 1]
          : 0;

      await RaceResult.create(
        [
          {
            raceId: race._id,
            registrationId: registration._id,
            horseId: registration.horseId._id,
            jockeyId: registration.jockeyId?._id ?? null,
            position,
            finishTime,
            prizeAmount,
            pointsEarned,
          },
        ],
        { session },
      );

      // Credit prize to horse owner (top 6)
      if (prizeAmount > 0) {
        const ownerWallet = await Wallet.findOne({ userId: registration.ownerId }).session(session);
        if (ownerWallet) {
          await walletService.creditWallet(
            ownerWallet._id,
            registration.ownerId,
            prizeAmount,
            'prize_payout',
            `Prize P${position}: ${race.name}`,
            race._id,
            'Race',
            session,
          );
        }
      }

      // Update horse career stats
      const incFields = {
        raceCount: 1,
        totalPoints: pointsEarned,
        totalEarnings: prizeAmount,
      };
      if (position === 1) incFields.winCount = 1;

      const updatedHorse = await Horse.findByIdAndUpdate(
        registration.horseId._id,
        { $inc: incFields },
        { new: true, session },
      );

      // Grade upgrade check (only up, never down)
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

      positionMap[registration.horseId._id.toString()] = position;
    }

    // Settle all pending bets in the same session
    await settleBetsWithSession(race._id, positionMap, race.name, session);

    await Race.findByIdAndUpdate(race._id, { $set: { status: 'finished' } }, { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Entry point called by cron after status is set to 'running'
async function runRaceSimulation(raceId) {
  const race = await Race.findById(raceId);
  if (!race || race.status !== 'running') {
    console.log(`[simulation] Race ${raceId} not in running state, skipping`);
    return;
  }

  const registrations = await Registration.find({
    raceId,
    status: 'active',
    'preCheckResult.status': 'passed',
  })
    .populate('horseId')
    .populate('jockeyId', 'fullName jockeyProfile');

  // Cancel race if fewer than 2 horses passed pre-check
  if (registrations.length < 2) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Race.findByIdAndUpdate(race._id, { $set: { status: 'cancelled' } }, { session });
      await refundRaceBets(raceId, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    console.log(`[simulation] Race ${raceId} cancelled — only ${registrations.length} eligible horse(s)`);
    return;
  }

  // Determine finish order: score + Gaussian noise → sort descending
  const ordered = registrations
    .map((reg) => ({
      registration: reg,
      horseId: reg.horseId._id,
      horseName: reg.horseId.name,
      jockeyName: reg.jockeyId?.fullName ?? null,
      score: calcScore(reg.horseId, reg.jockeyId),
    }))
    .map((e) => ({ ...e, noisyScore: e.score + gaussianNoise(0.1) }))
    .sort((a, b) => b.noisyScore - a.noisyScore)
    .map((e, idx) => ({
      ...e,
      position: idx + 1,
      // Simulated finish time: base 60s + ~500ms gap per position + small noise
      finishTime: 60000 + idx * 500 + Math.floor(Math.random() * 300),
    }));

  // Emit race:started with animation params — frontend animates locally at 60fps
  const n = ordered.length;
  let io;
  try {
    io = getIO();
    io.to(`race:${raceId}`).emit('race:started', {
      raceId,
      raceName: race.name,
      raceDurationMs: RACE_DURATION_MS,
      horses: ordered.map((e) => ({
        horseId: e.horseId.toString(),
        horseName: e.horseName,
        jockeyName: e.jockeyName,
        // speedFactor: winner=1.0, last≈0.75 — frontend uses this for local animation
        speedFactor: 1.0 - (e.position - 1) / Math.max(n - 1, 1) * 0.25,
        // Noise params: make mid-race positions dynamic, converge to true order at finish
        noiseAmplitude: 0.05,
        noiseFreq: 3 + Math.random() * 2,
        noisePhase: Math.random() * Math.PI * 2,
      })),
    });
  } catch { /* socket optional */ }

  // Wait for race to complete (frontend animates during this window)
  await new Promise((res) => setTimeout(res, RACE_DURATION_MS));

  // Commit everything atomically
  await finalizeRace(race, ordered);

  console.log(
    `[simulation] Race ${race.name} (${raceId}) finished — ` +
    `winner: ${ordered[0].horseName}, ${ordered.length} runners`,
  );

  // Emit final results after DB commit
  try {
    io = getIO();
    io.to(`race:${raceId}`).emit('race:finished', {
      raceId,
      raceName: race.name,
      results: ordered.map((e) => ({
        position: e.position,
        horseId: e.horseId,
        horseName: e.horseName,
        jockeyName: e.jockeyName,
        finishTime: e.finishTime,
        prizeAmount:
          e.position <= PRIZE_RATIO.length
            ? Math.floor(race.purse * PRIZE_RATIO[e.position - 1])
            : 0,
        pointsEarned:
          e.position <= (POINTS_BY_GRADE[race.grade]?.length ?? 0)
            ? POINTS_BY_GRADE[race.grade][e.position - 1]
            : 0,
      })),
    });
  } catch { /* socket optional */ }
}

module.exports = { runRaceSimulation };
