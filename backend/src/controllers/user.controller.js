const { Types } = require('mongoose');
const userService = require('../services/user.service');
const walletService = require('../services/wallet.service');
const { sendSuccess } = require('../utils/response');

async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user._id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    sendSuccess(res, user, 200, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

async function getMyWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletByUserId(new Types.ObjectId(req.user._id));
    sendSuccess(res, wallet);
  } catch (error) {
    next(error);
  }
}

async function getMyTransactions(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await walletService.getTransactionHistory(
      new Types.ObjectId(req.user._id),
      page,
      limit,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    const user = await userService.uploadAvatar(req.user._id, req.file.buffer);
    sendSuccess(res, user, 200, 'Avatar uploaded successfully');
  } catch (error) {
    next(error);
  }
}

async function getJockeys(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await userService.getJockeys(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getReferees(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await userService.getReferees(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { role } = req.query;
    const result = await userService.getUsers(page, limit, role);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function toggleActive(req, res, next) {
  try {
    const user = await userService.toggleActive(req.params.id);
    sendSuccess(res, user, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (error) {
    next(error);
  }
}

async function getMyRaceResults(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { RaceResult } = require('../models/race_result.model');
    const { Horse } = require('../models/horse.model');

    const horses = await Horse.find({ ownerId: req.user._id }).select('_id');
    const horseIds = horses.map(h => h._id);

    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
      RaceResult.find({ horseId: { $in: horseIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('raceId', 'name grade scheduledTime purse distance')
        .populate('horseId', 'name breed currentGrade')
        .populate('jockeyId', 'fullName'),
      RaceResult.countDocuments({ horseId: { $in: horseIds } }),
    ]);

    sendSuccess(res, { results, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

async function adminUpdateUser(req, res, next) {
  try {
    const user = await userService.adminUpdateUser(req.params.id, req.body);
    sendSuccess(res, user, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildMonthlyBuckets() {
  const now = new Date();
  const buckets = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { month: `T${d.getMonth() + 1}`, earnings: 0, wins: 0, races: 0 };
  }
  return buckets;
}

// ── GET /me/overview ──────────────────────────────────────────────────────────
async function getOverviewStats(req, res, next) {
  try {
    const userId = new Types.ObjectId(req.user._id);
    const role = req.user.role;

    const { RaceResult } = require('../models/race_result.model');
    const { Horse }      = require('../models/horse.model');
    const { Wallet }     = require('../models/wallet.model');

    if (role === 'owner') {
      const horses = await Horse.find({ ownerId: userId, isActive: true }).lean();
      const horseIds = horses.map(h => h._id);
      const [recentResults, wallet] = await Promise.all([
        RaceResult.find({ horseId: { $in: horseIds } })
          .sort({ createdAt: -1 }).limit(5)
          .populate('raceId', 'name grade scheduledTime')
          .populate('horseId', 'name currentGrade')
          .lean(),
        Wallet.findOne({ userId }).lean(),
      ]);
      const totalWins     = horses.reduce((s, h) => s + (h.winCount || 0), 0);
      const totalEarnings = horses.reduce((s, h) => s + (h.totalEarnings || 0), 0);
      const totalRaces    = horses.reduce((s, h) => s + (h.raceCount || 0), 0);
      return sendSuccess(res, {
        totalHorses: horses.length, totalWins, totalEarnings, totalRaces,
        walletBalance: wallet?.balance ?? 0,
        recentResults,
      });
    }

    if (role === 'jockey') {
      const { JockeyInvitation } = require('../models/jockey_invitation.model');
      const [pendingCount, upcomingRaces, recentResults, wallet] = await Promise.all([
        JockeyInvitation.countDocuments({ jockeyId: userId, status: 'pending' }),
        JockeyInvitation.find({ jockeyId: userId, status: 'accepted' })
          .sort({ createdAt: -1 }).limit(5)
          .populate('raceId', 'name grade scheduledTime status distance purse')
          .populate('horseId', 'name currentGrade')
          .populate('ownerId', 'fullName')
          .lean(),
        RaceResult.find({ jockeyId: userId })
          .sort({ createdAt: -1 }).limit(5)
          .populate('raceId', 'name grade scheduledTime')
          .populate('horseId', 'name currentGrade')
          .lean(),
        Wallet.findOne({ userId }).lean(),
      ]);
      const [totalWins, totalRaces] = await Promise.all([
        RaceResult.countDocuments({ jockeyId: userId, position: 1 }),
        RaceResult.countDocuments({ jockeyId: userId }),
      ]);
      return sendSuccess(res, {
        pendingInvitations: pendingCount, upcomingRaces,
        totalWins, totalRaces,
        walletBalance: wallet?.balance ?? 0,
        recentResults,
      });
    }

    if (role === 'referee') {
      const { Race }           = require('../models/race.model');
      const { RefereeReport }  = require('../models/referee_report.model');
      const [assignedRaces, reports] = await Promise.all([
        Race.find({ refereeId: userId }).sort({ scheduledTime: 1 }).lean(),
        RefereeReport.find({ refereeId: userId })
          .sort({ createdAt: -1 }).limit(5)
          .populate('raceId', 'name grade scheduledTime')
          .lean(),
      ]);
      const pendingChecks    = assignedRaces.filter(r => r.status === 'pre_check').length;
      const totalIncidents   = reports.reduce((s, r) => s + (r.incidents?.length || 0), 0);
      const submittedReports = reports.filter(r => r.status === 'submitted').length;
      const upcomingRaces    = assignedRaces
        .filter(r => ['open', 'closed', 'pre_check'].includes(r.status))
        .slice(0, 3);
      return sendSuccess(res, {
        assignedRacesCount: assignedRaces.length, pendingChecks,
        totalIncidents, submittedReports,
        upcomingRaces, recentReports: reports.slice(0, 3),
      });
    }

    if (role === 'spectator') {
      const { Bet } = require('../models/bet.model');
      const [bets, wallet] = await Promise.all([
        Bet.find({ spectatorId: userId })
          .sort({ createdAt: -1 }).limit(50)
          .populate('raceId', 'name grade scheduledTime')
          .populate('horseId', 'name')
          .lean(),
        Wallet.findOne({ userId }).lean(),
      ]);
      const pendingBets   = bets.filter(b => b.status === 'pending').length;
      const wonBets       = bets.filter(b => b.status === 'won').length;
      const lostBets      = bets.filter(b => b.status === 'lost').length;
      const totalWinnings = bets.reduce((s, b) => s + (b.payoutAmount || 0), 0);
      const settledBets   = wonBets + lostBets;
      const winRate       = settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0;
      return sendSuccess(res, {
        pendingBets, wonBets, lostBets,
        totalBets: bets.length, totalWinnings, winRate,
        walletBalance: wallet?.balance ?? 0,
        recentBets: bets.slice(0, 5),
      });
    }

    sendSuccess(res, {});
  } catch (error) {
    next(error);
  }
}

// ── GET /me/monthly-stats ─────────────────────────────────────────────────────
async function getMonthlyStats(req, res, next) {
  try {
    const userId = new Types.ObjectId(req.user._id);
    const role   = req.user.role;
    const { RaceResult } = require('../models/race_result.model');
    const { Horse }      = require('../models/horse.model');

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    if (role === 'owner') {
      const horses   = await Horse.find({ ownerId: userId }).select('_id').lean();
      const horseIds = horses.map(h => h._id);
      const results  = await RaceResult.find({
        horseId: { $in: horseIds }, createdAt: { $gte: sixMonthsAgo },
      }).select('createdAt prizeAmount position').lean();

      const buckets = buildMonthlyBuckets();
      for (const r of results) {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) {
          buckets[key].earnings += r.prizeAmount || 0;
          buckets[key].wins     += r.position === 1 ? 1 : 0;
          buckets[key].races    += 1;
        }
      }
      return sendSuccess(res, { monthly: Object.values(buckets) });
    }

    if (role === 'jockey') {
      const results = await RaceResult.find({
        jockeyId: userId, createdAt: { $gte: sixMonthsAgo },
      }).select('createdAt prizeAmount position').lean();

      const buckets = buildMonthlyBuckets();
      for (const r of results) {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) {
          buckets[key].earnings += r.prizeAmount || 0;
          buckets[key].wins     += r.position === 1 ? 1 : 0;
          buckets[key].races    += 1;
        }
      }
      return sendSuccess(res, { monthly: Object.values(buckets) });
    }

    sendSuccess(res, { monthly: [] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe, updateMe, getMyWallet, getMyTransactions, getMyRaceResults,
  uploadAvatar, getJockeys, getReferees, getUsers, toggleActive, adminUpdateUser,
  getOverviewStats, getMonthlyStats,
};
