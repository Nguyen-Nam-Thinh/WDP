const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { Bet } = require('../models/bet.model');

async function getHorseRankings({ limit = 20 } = {}) {
  const horses = await Horse.find({ isActive: true })
    .sort({ totalPoints: -1, winCount: -1 })
    .limit(limit)
    .populate('ownerId', 'fullName')
    .select('name currentGrade totalPoints totalEarnings raceCount winCount ownerId primaryImageUrl');

  return horses.map((h, i) => ({
    rank: i + 1,
    _id: h._id,
    name: h.name,
    owner: h.ownerId?.fullName || 'N/A',
    currentGrade: h.currentGrade,
    totalPoints: h.totalPoints,
    totalEarnings: h.totalEarnings,
    raceCount: h.raceCount,
    winCount: h.winCount,
    winRate: h.raceCount > 0 ? Math.round((h.winCount / h.raceCount) * 100) : 0,
  }));
}

async function getJockeyRankings({ limit = 20 } = {}) {
  const jockeys = await User.find({ role: 'jockey', isActive: true })
    .sort({ 'jockeyProfile.winCount': -1, 'jockeyProfile.raceCount': -1 })
    .limit(limit)
    .select('fullName avatarUrl jockeyProfile');

  return jockeys.map((j, i) => ({
    rank: i + 1,
    _id: j._id,
    name: j.fullName,
    winCount: j.jockeyProfile?.winCount || 0,
    raceCount: j.jockeyProfile?.raceCount || 0,
    experienceYears: j.jockeyProfile?.experienceYears || 0,
    winRate:
      (j.jockeyProfile?.raceCount || 0) > 0
        ? Math.round(((j.jockeyProfile?.winCount || 0) / j.jockeyProfile.raceCount) * 100)
        : 0,
  }));
}

async function getOwnerRankings({ limit = 20 } = {}) {
  const results = await Horse.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$ownerId',
        totalHorses: { $sum: 1 },
        totalWins: { $sum: '$winCount' },
        totalRaces: { $sum: '$raceCount' },
        totalEarnings: { $sum: '$totalEarnings' },
        totalPoints: { $sum: '$totalPoints' },
      },
    },
    { $sort: { totalEarnings: -1, totalWins: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
  ]);

  return results.map((r, i) => ({
    rank: i + 1,
    _id: r._id,
    name: r.owner.fullName,
    totalHorses: r.totalHorses,
    totalWins: r.totalWins,
    totalRaces: r.totalRaces,
    totalEarnings: r.totalEarnings,
    totalPoints: r.totalPoints,
    winRate: r.totalRaces > 0 ? Math.round((r.totalWins / r.totalRaces) * 100) : 0,
  }));
}

async function getSpectatorLeaderboard({ limit = 20 } = {}) {
  const results = await Bet.aggregate([
    { $match: { status: { $in: ['won', 'lost'] } } },
    {
      $group: {
        _id: '$spectatorId',
        totalBets: { $sum: 1 },
        wonBets: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
        totalPayout: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$payoutAmount', 0] } },
        totalBetAmount: { $sum: '$amount' },
      },
    },
    { $sort: { totalPayout: -1, wonBets: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'spectator',
      },
    },
    { $unwind: '$spectator' },
  ]);

  return results.map((r, i) => ({
    rank: i + 1,
    _id: r._id,
    name: r.spectator.fullName,
    totalBets: r.totalBets,
    wonBets: r.wonBets,
    totalPayout: r.totalPayout,
    totalBetAmount: r.totalBetAmount,
    winRate: r.totalBets > 0 ? Math.round((r.wonBets / r.totalBets) * 100) : 0,
    profit: r.totalPayout - r.totalBetAmount,
  }));
}

module.exports = { getHorseRankings, getJockeyRankings, getOwnerRankings, getSpectatorLeaderboard };
