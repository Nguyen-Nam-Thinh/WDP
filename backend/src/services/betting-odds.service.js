const mongoose = require('mongoose');
const { Bet } = require('../models/bet.model');
const { Registration } = require('../models/registration.model');
const { BET_ODDS_CONFIG } = require('../config/constants');
const aiPredictionService = require('./ai-prediction.service');
const { getIO } = require('../sockets');

const BET_TYPES = Object.keys(BET_ODDS_CONFIG.baseOdds);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundOdds(value) {
  return Math.round(value * 100) / 100;
}

function aiProbForBetType(prediction, betType) {
  const win = (prediction?.winProbability ?? 10) / 100;
  const top3 = (prediction?.top3Probability ?? win * 2.5) / 100;
  if (betType === 'win') return win;
  if (betType === 'place') return clamp(top3 * 0.65, 0.05, 0.9);
  return clamp(top3 * 0.85, 0.08, 0.95);
}

function calcMultiplier(betType, poolShare, aiProb, formFactor = 0.5) {
  const base = BET_ODDS_CONFIG.baseOdds[betType];
  const [min, max] = BET_ODDS_CONFIG.bounds[betType];
  const historyBonus = (formFactor - 0.5) * BET_ODDS_CONFIG.formBonusScale * base;
  const poolPenalty = poolShare * base * 0.85;
  const aiPenalty = aiProb * base * 0.35 * BET_ODDS_CONFIG.historyWeight;
  const raw = base - poolPenalty - aiPenalty + historyBonus;
  return roundOdds(clamp(raw, min, max));
}

async function aggregatePools(raceId) {
  const raceObjectId = new mongoose.Types.ObjectId(raceId);
  const rows = await Bet.aggregate([
    { $match: { raceId: raceObjectId, status: 'pending' } },
    {
      $group: {
        _id: { horseId: '$horseId', betType: '$betType' },
        totalAmount: { $sum: '$amount' },
        betCount: { $sum: 1 },
      },
    },
  ]);

  const byHorse = {};
  const totalsByType = {};
  BET_TYPES.forEach((t) => { totalsByType[t] = 0; });

  for (const row of rows) {
    const horseKey = row._id.horseId.toString();
    const betType = row._id.betType;
    if (!byHorse[horseKey]) {
      byHorse[horseKey] = {};
      BET_TYPES.forEach((t) => {
        byHorse[horseKey][t] = { totalAmount: 0, betCount: 0, poolShare: 0 };
      });
    }
    byHorse[horseKey][betType] = {
      totalAmount: row.totalAmount,
      betCount: row.betCount,
      poolShare: 0,
    };
    totalsByType[betType] = (totalsByType[betType] ?? 0) + row.totalAmount;
  }

  for (const horseKey of Object.keys(byHorse)) {
    for (const betType of BET_TYPES) {
      const total = totalsByType[betType] ?? 0;
      const amount = byHorse[horseKey][betType].totalAmount;
      byHorse[horseKey][betType].poolShare = total > 0 ? amount / total : 0;
    }
  }

  return { byHorse, totalsByType };
}

async function getPredictionMap(raceId) {
  try {
    const { predictions } = await aiPredictionService.getPredictions(raceId);
    const map = new Map();
    for (const p of predictions) {
      map.set(p.horseId.toString(), p);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function getFormFactorMap(raceId) {
  const registrations = await Registration.find({ raceId, status: 'active' })
    .populate('horseId', 'name');
  const { RaceResult } = require('../models/race_result.model');
  const { AI_CONFIG } = require('../config/constants');
  const lookback = AI_CONFIG.winProbability.formLookback;

  const map = new Map();
  await Promise.all(registrations.map(async (reg) => {
    const horseId = reg.horseId._id.toString();
    const recent = await RaceResult.find({ horseId: reg.horseId._id })
      .sort({ createdAt: -1 })
      .limit(lookback)
      .select('position');
    if (!recent.length) {
      map.set(horseId, 0.5);
      return;
    }
    const avg = recent.reduce((s, r) => s + r.position, 0) / recent.length;
    map.set(horseId, Math.max(0, Math.min(1, 1 - (avg - 1) / 9)));
  }));
  return map;
}

function buildHorseOdds(horseId, horseName, pools, prediction, formFactor) {
  const horsePools = pools.byHorse[horseId] ?? {};
  const odds = {};

  for (const betType of BET_TYPES) {
    const pool = horsePools[betType] ?? { totalAmount: 0, betCount: 0, poolShare: 0 };
    const aiProb = aiProbForBetType(prediction, betType);
    odds[betType] = {
      multiplier: calcMultiplier(betType, pool.poolShare, aiProb, formFactor),
      poolAmount: pool.totalAmount,
      poolShare: Math.round(pool.poolShare * 1000) / 10,
      betCount: pool.betCount,
      impliedProb: Math.round(
        (BET_ODDS_CONFIG.historyWeight * aiProb + BET_ODDS_CONFIG.poolWeight * pool.poolShare) * 1000,
      ) / 10,
    };
  }

  return { horseId, horseName, odds };
}

async function getRaceBettingOdds(raceId) {
  const [pools, predictionMap, formMap, registrations] = await Promise.all([
    aggregatePools(raceId),
    getPredictionMap(raceId),
    getFormFactorMap(raceId),
    Registration.find({ raceId, status: 'active' }).populate('horseId', 'name'),
  ]);

  const horses = registrations.map((reg) => {
    const horseId = reg.horseId._id.toString();
    return buildHorseOdds(
      horseId,
      reg.horseId.name,
      pools,
      predictionMap.get(horseId),
      formMap.get(horseId) ?? 0.5,
    );
  });

  return {
    raceId,
    totalsByType: pools.totalsByType,
    horses,
    updatedAt: new Date().toISOString(),
  };
}

async function calcLockedMultiplier(raceId, horseId, betType) {
  const [pools, predictionMap, formMap] = await Promise.all([
    aggregatePools(raceId),
    getPredictionMap(raceId),
    getFormFactorMap(raceId),
  ]);
  const horsePools = pools.byHorse[horseId.toString()] ?? {};
  const pool = horsePools[betType] ?? { poolShare: 0 };
  const prediction = predictionMap.get(horseId.toString());
  const formFactor = formMap.get(horseId.toString()) ?? 0.5;
  const aiProb = aiProbForBetType(prediction, betType);
  return calcMultiplier(betType, pool.poolShare, aiProb, formFactor);
}

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
  calcLockedMultiplier,
  emitPoolUpdated,
  calcMultiplier,
  BET_TYPES,
};
