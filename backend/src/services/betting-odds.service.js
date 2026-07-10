/**
 * betting-odds.service.js
 *
 * Parimutuel odds (Option B):
 *   - Odds chỉ là ƯỚC TÍNH dựa trên pool hiện tại
 *   - Multiplier thực tế chỉ tính khi race kết thúc (xem bet.service.js → settleBets)
 *   - estimatedMultiplier = (totalPool × (1 - rake)) / amountOnHorse
 */

const mongoose = require('mongoose');
const { Bet } = require('../models/bet.model');
const { Registration } = require('../models/registration.model');
const { PARIMUTUEL_CONFIG, AI_CONFIG } = require('../config/constants');
const aiPredictionService = require('./ai-prediction.service');
const { getIO } = require('../sockets');

const { rake, minMultiplier, maxMultiplier, defaultEstimate } = PARIMUTUEL_CONFIG;
const GRADE_WEIGHTS = AI_CONFIG.winProbability.gradeWeights;

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundOdds(value) {
  return Math.round(value * 100) / 100;
}

function toId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return value.toString();
}

/** Tính win probability đơn giản từ stats ngựa + jockey (không cần AI service) */
function calcHorseStrength(horse, jockey) {
  if (!horse) return 0.1;
  const winRate = horse.raceCount > 0 ? horse.winCount / horse.raceCount : 0.08;
  const pointsNorm = Math.min((horse.totalPoints ?? 0) / 100, 1);
  const gradeW = GRADE_WEIGHTS[horse.currentGrade] ?? 0.25;
  const jp = jockey?.jockeyProfile;
  const jockeyWR = jp?.raceCount > 0 ? jp.winCount / jp.raceCount : 0.1;
  return winRate * 0.4 + pointsNorm * 0.2 + gradeW * 0.2 + jockeyWR * 0.2;
}

function softmaxProbs(strengths) {
  const beta = AI_CONFIG.winProbability.softmaxBeta;
  const exps = strengths.map((s) => Math.exp(beta * s));
  const total = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / total);
}

// ── Pool Aggregation ──────────────────────────────────────────────────────────

/**
 * Tổng hợp pool cược theo từng ngựa.
 * Returns: { byHorse: { [horseId]: { totalAmount, betCount } }, totalPool }
 */
async function aggregatePools(raceId) {
  const raceObjectId = new mongoose.Types.ObjectId(raceId);
  const rows = await Bet.aggregate([
    { $match: { raceId: raceObjectId, status: 'pending' } },
    {
      $group: {
        _id: '$horseId',
        totalAmount: { $sum: '$amount' },
        betCount: { $sum: 1 },
      },
    },
  ]);

  const byHorse = {};
  let totalPool = 0;

  for (const row of rows) {
    const horseKey = row._id.toString();
    byHorse[horseKey] = {
      totalAmount: row.totalAmount,
      betCount: row.betCount,
    };
    totalPool += row.totalAmount;
  }

  return { byHorse, totalPool };
}

// ── AI Predictions ────────────────────────────────────────────────────────────

async function getPredictionMap(raceId) {
  try {
    const { predictions } = await aiPredictionService.getPredictions(raceId);
    const map = new Map();
    for (const p of predictions) {
      map.set(toId(p.horseId), p);
    }
    return map;
  } catch {
    return new Map();
  }
}

// ── Main: getRaceBettingOdds ──────────────────────────────────────────────────

/**
 * Trả về odds ước tính cho từng ngựa trong race.
 * estimatedMultiplier = (totalPool × (1 - rake)) / amountOnHorse
 * Nếu chưa có pool → dùng win probability từ AI/stats để ước tính
 */
async function getRaceBettingOdds(raceId) {
  const [pools, predictionMap, registrations] = await Promise.all([
    aggregatePools(raceId),
    getPredictionMap(raceId),
    Registration.find({ raceId, status: 'active' })
      .populate('horseId', 'name breed currentGrade totalPoints winCount raceCount')
      .populate('jockeyId', 'fullName jockeyProfile')
      .sort({ registeredAt: 1 }),
  ]);

  const { byHorse, totalPool } = pools;
  const payoutPool = totalPool * (1 - rake); // 90% dành cho người thắng

  // Tính win probability từ stats (để hiển thị thông tin)
  const entries = registrations.map((reg) => ({
    horseId: toId(reg.horseId),
    horseName: reg.horseId?.name ?? 'Unknown',
    horse: reg.horseId,
    jockey: reg.jockeyId,
    prediction: predictionMap.get(toId(reg.horseId)),
  }));

  const strengths = entries.map((e) => calcHorseStrength(e.horse, e.jockey));
  const statWinProbs = softmaxProbs(strengths);

  const horses = entries.map((e, i) => {
    const horseId = e.horseId;
    if (!horseId) return null;

    const horsePool = byHorse[horseId];
    const amountOnHorse = horsePool?.totalAmount ?? 0;
    const betCount = horsePool?.betCount ?? 0;

    // Win probability (chỉ để hiển thị, không dùng tính multiplier)
    const predWin = e.prediction?.winProbability;
    const winProb = predWin != null ? predWin / 100 : statWinProbs[i];

    let estimatedMultiplier;
    if (totalPool === 0 || amountOnHorse === 0) {
      // Chưa có pool: ước tính nghịch đảo win probability (ngựa yếu → odds cao)
      const safeProb = Math.max(winProb, 0.01);
      estimatedMultiplier = roundOdds(clamp((1 - rake) / safeProb, minMultiplier, maxMultiplier));
    } else {
      estimatedMultiplier = roundOdds(clamp(payoutPool / amountOnHorse, minMultiplier, maxMultiplier));
    }

    return {
      horseId,
      horseName: e.horseName,
      winProb: Math.round(winProb * 1000) / 10,  // % format
      estimatedMultiplier,
      poolAmount: amountOnHorse,
      betCount,
      poolShare: totalPool > 0 ? Math.round((amountOnHorse / totalPool) * 1000) / 10 : 0,
    };
  }).filter(Boolean);

  return {
    raceId: raceId.toString(),
    totalPool,
    payoutPool: Math.round(payoutPool),
    rake: Math.round(rake * 100),
    horses,
    updatedAt: new Date().toISOString(),
  };
}

// ── calcEstimatedMultiplier ───────────────────────────────────────────────────

/**
 * Tính odds ước tính cho 1 ngựa cụ thể tại thời điểm đặt cược.
 * Lưu ý: đây chỉ là ước tính — multiplier thực tế tính khi settle.
 */
async function calcEstimatedMultiplier(raceId, horseId) {
  const odds = await getRaceBettingOdds(raceId);
  const horse = odds.horses.find((h) => h.horseId === toId(horseId));
  return horse ? horse.estimatedMultiplier : defaultEstimate;
}

// ── calcFinalPayouts ──────────────────────────────────────────────────────────

/**
 * Tính payout thực tế parimutuel khi race kết thúc.
 * Chỉ ngựa về nhất (pos === 1) là thắng.
 * Returns: { winnerHorseId, totalPool, payoutPool, multiplier, perBetPayouts: [{betId, payout}] }
 */
async function calcFinalPayouts(raceId, winnerHorseId) {
  const pendingBets = await Bet.find({ raceId, status: 'pending' });
  if (!pendingBets.length) return null;

  const totalPool = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const payoutPool = Math.floor(totalPool * (1 - rake));

  const winnerBets = pendingBets.filter(
    (b) => b.horseId.toString() === winnerHorseId.toString()
  );
  const amountOnWinner = winnerBets.reduce((sum, b) => sum + b.amount, 0);

  // Nếu không ai cược vào ngựa thắng → hoàn tiền cho tất cả (edge case)
  if (amountOnWinner === 0) {
    return {
      winnerHorseId: winnerHorseId.toString(),
      totalPool,
      payoutPool,
      multiplier: 0,
      noWinners: true,
      perBetPayouts: [],
    };
  }

  const multiplier = roundOdds(clamp(payoutPool / amountOnWinner, minMultiplier, maxMultiplier));

  const perBetPayouts = winnerBets.map((b) => ({
    betId: b._id,
    payout: Math.floor((b.amount / amountOnWinner) * payoutPool),
  }));

  return {
    winnerHorseId: winnerHorseId.toString(),
    totalPool,
    payoutPool,
    multiplier,
    noWinners: false,
    perBetPayouts,
  };
}

// ── Socket emit ───────────────────────────────────────────────────────────────

async function emitPoolUpdated(raceId) {
  try {
    const io = getIO();
    const odds = await getRaceBettingOdds(raceId);
    io.to(`betting:${raceId}`).emit('bet:pool_updated', odds);
  } catch {
    /* socket optional */
  }
}

module.exports = {
  getRaceBettingOdds,
  calcEstimatedMultiplier,
  calcFinalPayouts,
  emitPoolUpdated,
};
