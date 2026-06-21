const mongoose = require('mongoose');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { RaceResult } = require('../models/race_result.model');
const { Horse } = require('../models/horse.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { settleBetsWithSession, refundRaceBets } = require('./bet.service');
const { createManyNotifications } = require('./notification.service');
const { completeInvitationsForRace } = require('./jockey_invitation.service');
const { Bet } = require('../models/bet.model');
const { getIO } = require('../sockets');
const {
  POINTS_BY_GRADE,
  PRIZE_RATIO,
  GRADE_THRESHOLDS,
  AI_CONFIG,
  TRACK_CONDITIONS,
  JOCKEY_STYLE_SPEED_PROFILES,
} = require('../config/constants');

// Duration scales with race distance (60ms per meter), clamped 30s–90s
function calcRaceDurationMs(distanceMeters) {
  return Math.min(Math.max(distanceMeters * 60, 30_000), 90_000);
}

// ─── Gaussian noise (Box-Muller) ─────────────────────────────────────────────
function gaussianNoise(sigma = 1) {
  let u1, u2;
  do { u1 = Math.random(); } while (u1 === 0);
  do { u2 = Math.random(); } while (u2 === 0);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

// ─── Form factor: average finish position over last N races ──────────────────
// Returns [0, 1] where 1.0 = consistently finishes 1st, 0.5 = neutral (no data)
async function calcFormFactor(horseId, lookback = AI_CONFIG.winProbability.formLookback) {
  const recent = await RaceResult.find({ horseId })
    .sort({ createdAt: -1 })
    .limit(lookback)
    .select('position');

  if (!recent.length) return 0.5;

  const avgPosition = recent.reduce((sum, r) => sum + r.position, 0) / recent.length;
  // Normalize assuming average field size of 10; clamp to [0, 1]
  return Math.max(0, Math.min(1, 1 - (avgPosition - 1) / 9));
}

// ─── Track condition multiplier: weight delta + breed modifier + preferred track bonus ──
function getTrackMultiplier(horse, avgFieldWeight, trackCondition) {
  const condition = TRACK_CONDITIONS[trackCondition];
  if (!condition || !horse.weight || !avgFieldWeight || avgFieldWeight === 0) return 1.0;

  const delta = horse.weight / avgFieldWeight - 1.0;
  const weightFactor = 1.0 + delta * condition.weightEffect;
  const breedFactor = condition.breedModifiers?.[horse.breed] ?? 1.0;
  const prefBonus = horse.preferredTrackCondition === trackCondition ? condition.preferredBonus : 1.0;

  return weightFactor * breedFactor * prefBonus;
}

// ─── Base score (same formula used by ai-prediction, kept in sync) ───────────
function calcBaseScore(horse, jockeyUser) {
  const { weights, gradeWeights } = AI_CONFIG.winProbability;

  const horseWinRate = horse.raceCount > 0 ? horse.winCount / horse.raceCount : 0;
  const gradeWeight = gradeWeights[horse.currentGrade] ?? 0.25;
  const normalizedPoints = Math.min(horse.totalPoints / 100, 1);

  const jp = jockeyUser?.jockeyProfile;
  const jockeyWinRate = jp?.raceCount > 0 ? jp.winCount / jp.raceCount : 0;

  // formFactor handled separately (async) — use 0.5 neutral here, overridden later
  return (
    weights.horseWinRate * horseWinRate +
    weights.gradeWeight * gradeWeight +
    weights.pointsWeight * normalizedPoints +
    weights.jockeyWinRate * jockeyWinRate
  );
}

// ─── Grade upgrade (only up, never down) ─────────────────────────────────────
function getUpgradedGrade(currentGrade, totalPoints) {
  const order = ['Maiden', 'G3', 'G2', 'G1'];
  const currentIdx = order.indexOf(currentGrade);
  if (totalPoints >= GRADE_THRESHOLDS.G1 && currentIdx < 3) return 'G1';
  if (totalPoints >= GRADE_THRESHOLDS.G2 && currentIdx < 2) return 'G2';
  if (totalPoints >= GRADE_THRESHOLDS.G3 && currentIdx < 1) return 'G3';
  return currentGrade;
}

// ─── Atomic DB write: results + prizes + points + grade upgrades + bets ───────
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
        [{
          raceId: race._id,
          registrationId: registration._id,
          horseId: registration.horseId._id,
          jockeyId: registration.jockeyId?._id ?? null,
          position,
          finishTime,
          prizeAmount,
          pointsEarned,
        }],
        { session },
      );

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

      const incFields = { raceCount: 1, totalPoints: pointsEarned, totalEarnings: prizeAmount };
      if (position === 1) incFields.winCount = 1;

      const updatedHorse = await Horse.findByIdAndUpdate(
        registration.horseId._id,
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

      positionMap[registration.horseId._id.toString()] = position;
    }

    await settleBetsWithSession(race._id, positionMap, race.name, session);
    await completeInvitationsForRace(race._id, session);
    await Race.findByIdAndUpdate(race._id, { $set: { status: 'finished' } }, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ─── Entry point called by cron after status is set to 'running' ──────────────
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

  // ── Determine track condition for this race ───────────────────────────────
  const trackConditionKeys = Object.keys(TRACK_CONDITIONS);
  const trackCondition = trackConditionKeys[Math.floor(Math.random() * trackConditionKeys.length)];

  // ── Field average weight for track condition calculation ──────────────────
  const weights = registrations.map(r => r.horseId.weight ?? 500);
  const avgFieldWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

  // ── Collect form factors for all horses in parallel ───────────────────────
  const formFactors = await Promise.all(
    registrations.map(r => calcFormFactor(r.horseId._id)),
  );

  // ── Compute final score per horse ─────────────────────────────────────────
  const { weights: w } = AI_CONFIG.winProbability;
  const scored = registrations.map((reg, i) => {
    const baseScore = calcBaseScore(reg.horseId, reg.jockeyId);
    const formBonus = w.formFactor * formFactors[i];
    const trackMultiplier = getTrackMultiplier(reg.horseId, avgFieldWeight, trackCondition);
    const jockeyStyle = reg.jockeyId?.jockeyProfile?.style ?? reg.horseId.temperament ?? 'balanced';
    const styleProfile = JOCKEY_STYLE_SPEED_PROFILES[jockeyStyle] ?? JOCKEY_STYLE_SPEED_PROFILES.balanced;
    const styleTrackBonus = styleProfile.trackBonus?.[trackCondition] ?? 1.0;
    const finalScore = (baseScore + formBonus) * trackMultiplier * styleTrackBonus;
    return {
      registration: reg,
      horseId: reg.horseId._id,
      horseName: reg.horseId.name,
      jockeyName: reg.jockeyId?.fullName ?? null,
      jockeyStyle,
      riskFactor: styleProfile.riskFactor ?? 0.1,
      score: finalScore,
    };
  });

  // ── Add Gaussian noise and determine finish order ─────────────────────────
  const n = scored.length;
  const ordered = scored
    .map(e => ({ ...e, noisyScore: e.score + gaussianNoise(e.riskFactor) }))
    .sort((a, b) => b.noisyScore - a.noisyScore)
    .map((e, idx) => {
      // Finish time: base pace ~60ms per meter + 500ms gap per position + small noise
      // (1000m race → winner finishes in ~60s, realistic horse racing pace)
      const basePaceMs = race.distance * 60;
      const finishTime = basePaceMs + idx * 500 + Math.floor(Math.abs(gaussianNoise(200)));

      // Base speed factor: winner = 1.0, last ≈ 0.75
      const baseFactor = 1.0 - (idx / Math.max(n - 1, 1)) * 0.25;

      // Phase-based speed profile adjusted for jockey style
      const styleProfile = JOCKEY_STYLE_SPEED_PROFILES[e.jockeyStyle] ?? JOCKEY_STYLE_SPEED_PROFILES.balanced;
      const speedProfile = styleProfile.phases.map(p => baseFactor * p);

      return {
        ...e,
        position: idx + 1,
        finishTime,
        baseFactor,
        speedProfile,
      };
    });

  const raceDurationMs = calcRaceDurationMs(race.distance ?? 1000);

  // ── Emit race:started with per-horse speed profiles ───────────────────────
  let io;
  try {
    io = getIO();
    io.to(`race:${raceId}`).emit('race:started', {
      raceId,
      raceName: race.name,
      raceDurationMs,
      trackCondition,
      horses: ordered.map(e => ({
        horseId: e.horseId.toString(),
        horseName: e.horseName,
        jockeyName: e.jockeyName,
        jockeyStyle: e.jockeyStyle,
        speedProfile: e.speedProfile,   // [phase1Factor, phase2Factor, phase3Factor]
        finalRank: e.position,          // actual finish rank — drives animation curve
        noisePhase: Math.random() * Math.PI * 2,
      })),
    });
  } catch { /* socket optional */ }

  // ── Wait for race animation window ────────────────────────────────────────
  await new Promise(res => setTimeout(res, raceDurationMs));

  // ── Commit results atomically ─────────────────────────────────────────────
  await finalizeRace(race, ordered);

  console.log(
    `[simulation] Race ${race.name} (${raceId}) finished [${trackCondition}] — ` +
    `winner: ${ordered[0].horseName} (${ordered[0].jockeyStyle}), ${n} runners`,
  );

  // ── Emit final results after DB commit ────────────────────────────────────
  try {
    io = getIO();
    io.to(`race:${raceId}`).emit('race:finished', {
      raceId,
      raceName: race.name,
      trackCondition,
      results: ordered.map(e => ({
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

  // ── Send in-app notifications (fire-and-forget) ───────────────────────────
  sendRaceFinishedNotifications(race, ordered, registrations).catch(() => {});
}

async function sendRaceFinishedNotifications(race, ordered, registrations) {
  const notifications = [];

  for (const entry of ordered) {
    const reg = entry.registration;
    const pos = entry.position;
    const prizeAmount = pos <= PRIZE_RATIO.length ? Math.floor(race.purse * PRIZE_RATIO[pos - 1]) : 0;
    const posLabel = pos === 1 ? '🥇 Hạng 1' : pos === 2 ? '🥈 Hạng 2' : pos === 3 ? '🥉 Hạng 3' : `Hạng ${pos}`;

    // Notify owner
    if (reg.ownerId) {
      notifications.push({
        userId: reg.ownerId,
        type: prizeAmount > 0 ? 'prize_received' : 'race_finished',
        title: `Race "${race.name}" đã kết thúc`,
        message: prizeAmount > 0
          ? `Ngựa ${entry.horseName} về ${posLabel} — nhận ${prizeAmount.toLocaleString('vi-VN')} coins`
          : `Ngựa ${entry.horseName} về ${posLabel}`,
        data: { raceId: race._id, position: pos },
      });
    }

    // Notify jockey
    if (reg.jockeyId) {
      notifications.push({
        userId: reg.jockeyId._id ?? reg.jockeyId,
        type: 'race_finished',
        title: `Race "${race.name}" đã kết thúc`,
        message: `Bạn cưỡi ${entry.horseName} về ${posLabel}${prizeAmount > 0 ? ` — thưởng ${prizeAmount.toLocaleString('vi-VN')} coins` : ''}`,
        data: { raceId: race._id, position: pos },
      });
    }
  }

  // Notify spectators who placed bets
  const bets = await Bet.find({ raceId: race._id, status: { $in: ['won', 'lost', 'refunded'] } })
    .select('spectatorId status payoutAmount betType');

  for (const bet of bets) {
    if (bet.status === 'won') {
      notifications.push({
        userId: bet.spectatorId,
        type: 'bet_won',
        title: '🎉 Cược thắng!',
        message: `Bạn thắng cược race "${race.name}" — nhận ${(bet.payoutAmount || 0).toLocaleString('vi-VN')} coins`,
        data: { raceId: race._id, betId: bet._id },
      });
    } else if (bet.status === 'lost') {
      notifications.push({
        userId: bet.spectatorId,
        type: 'bet_lost',
        title: 'Cược thua',
        message: `Cược của bạn trong race "${race.name}" không thắng`,
        data: { raceId: race._id, betId: bet._id },
      });
    }
  }

  await createManyNotifications(notifications);
}

module.exports = { runRaceSimulation };
