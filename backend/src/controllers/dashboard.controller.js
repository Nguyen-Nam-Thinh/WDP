const { User } = require('../models/user.model');
const { Tournament } = require('../models/tournament.model');
const { Registration } = require('../models/registration.model');
const { Race } = require('../models/race.model');
const { sendSuccess } = require('../utils/response');

async function getAdminDashboard(req, res, next) {
  try {
    const [totalUsers, ongoingTournaments, activeRegistrations, pendingRaces] = await Promise.all([
      User.countDocuments({}),
      Tournament.countDocuments({ status: 'ongoing' }),
      Registration.countDocuments({ status: 'active', 'preCheckResult.status': 'pending' }),
      Race.countDocuments({ status: 'open' }),
    ]);

    const stats = {
      totalUsers,
      ongoingTournaments,
      activeRegistrations,
      pendingRaces,
    };

    // Calculate chart data (User registrations per month for the given year)
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const chartData = [];
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(targetYear, month, 1);
      const endOfMonth = new Date(targetYear, month + 1, 0, 23, 59, 59, 999);
      
      const count = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });
      
      chartData.push({
        name: `Th ${month + 1}`,
        users: count,
      });
    }

    // Fetch recent activities
    // 1. Recent Users
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(3).select('fullName email createdAt');
    // 2. Recent Tournaments
    const recentTournaments = await Tournament.find({}).sort({ createdAt: -1 }).limit(3).select('name createdAt');
    // 3. Recent Registrations
    const recentRegistrations = await Registration.find({}).populate('horseId', 'name').sort({ createdAt: -1 }).limit(3).select('horseId status createdAt');

    // Combine and sort activities
    const activities = [
      ...recentUsers.map(u => ({
        type: 'user',
        title: 'Người dùng mới',
        desc: u.email,
        createdAt: u.createdAt,
      })),
      ...recentTournaments.map(t => ({
        type: 'tournament',
        title: 'Tạo giải đấu mới',
        desc: t.name,
        createdAt: t.createdAt,
      })),
      ...recentRegistrations.map(r => ({
        type: 'registration',
        title: 'Đăng ký mới',
        desc: `Ngựa: ${r.horseId ? r.horseId.name : 'Unknown'}`,
        createdAt: r.createdAt,
      })),
    ];

    activities.sort((a, b) => b.createdAt - a.createdAt);
    const now = new Date();
    const recentActivities = activities.slice(0, 5).map(act => {
      // Calculate time string (e.g. "5 phút trước")
      const diffMs = now - act.createdAt;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeStr = 'Vừa xong';
      if (diffDays > 0) timeStr = `${diffDays} ngày trước`;
      else if (diffHours > 0) timeStr = `${diffHours} giờ trước`;
      else if (diffMins > 0) timeStr = `${diffMins} phút trước`;

      return {
        ...act,
        time: timeStr,
      };
    });

    // Fetch recent tournaments for the table
    const upcomingTournaments = await Tournament.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name startDate endDate location status');

    sendSuccess(res, {
      stats,
      chartData,
      recentActivities,
      upcomingTournaments,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminDashboard,
};
