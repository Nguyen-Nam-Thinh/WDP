const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { Tournament } = require('../models/tournament.model');
const { Race } = require('../models/race.model');

async function getPlatformStats() {
  const [
    ongoingTournaments,
    totalHorses,
    totalJockeys,
    totalSpectators,
    liveRaces,
    topHorses,
  ] = await Promise.all([
    Tournament.countDocuments({ status: 'ongoing' }),
    Horse.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'jockey', isActive: true }),
    User.countDocuments({ role: 'spectator', isActive: true }),
    Race.find({ status: { $in: ['running', 'pre_check', 'closed'] } })
      .sort({ scheduledTime: 1 })
      .limit(3)
      .select('name grade status distance purse scheduledTime tournamentId')
      .populate('tournamentId', 'name'),
    Horse.find({ isActive: true, raceCount: { $gt: 0 } })
      .sort({ totalPoints: -1, winCount: -1 })
      .limit(5)
      .select('name currentGrade totalPoints winCount raceCount'),
  ]);

  return {
    ongoingTournaments,
    totalHorses,
    totalJockeys,
    totalSpectators,
    liveRaces: liveRaces.map((r) => ({
      _id: r._id,
      name: r.name,
      grade: r.grade,
      status: r.status,
      distance: r.distance,
      purse: r.purse,
      scheduledTime: r.scheduledTime,
      tournamentName: r.tournamentId?.name || '',
    })),
    topHorses: topHorses.map((h, i) => ({
      rank: i + 1,
      _id: h._id,
      name: h.name,
      currentGrade: h.currentGrade,
      totalPoints: h.totalPoints,
      winCount: h.winCount,
      raceCount: h.raceCount,
      winRate: h.raceCount > 0 ? Math.round((h.winCount / h.raceCount) * 100) : 0,
    })),
  };
}

module.exports = { getPlatformStats };
