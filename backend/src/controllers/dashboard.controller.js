const { User } = require('../models/user.model');
const { Tournament } = require('../models/tournament.model');
const { Registration } = require('../models/registration.model');
const { Race } = require('../models/race.model');
const { sendSuccess } = require('../utils/response');

async function getUserChartByYear(targetYear) {
  const users = await User.find({
    createdAt: { $gte: new Date(targetYear, 0, 1), $lt: new Date(targetYear + 1, 0, 1) }
  }).select('createdAt');

  const chartData = Array.from({ length: 12 }, (_, i) => ({ name: `Th ${i + 1}`, users: 0 }));

  users.forEach(user => {
    const month = user.createdAt.getMonth();
    chartData[month].users += 1;
  });

  return chartData;
}

async function getUserChartByMonth(targetYear) {
  const targetMonth = new Date().getMonth();
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  
  const users = await User.find({
    createdAt: { $gte: new Date(targetYear, targetMonth, 1), $lt: new Date(targetYear, targetMonth + 1, 1) }
  }).select('createdAt');

  const chartData = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}/${targetMonth + 1}`, users: 0 }));

  users.forEach(user => {
    const day = user.createdAt.getDate();
    chartData[day - 1].users += 1;
  });

  return chartData;
}

async function getUserChartByWeek() {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const users = await User.find({
    createdAt: { $gte: weekStart }
  }).select('createdAt');

  const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return { 
      name: DAY_NAMES[date.getDay()], 
      fullDate: `${date.getDate()}/${date.getMonth() + 1}`, 
      users: 0,
      _dateStr: date.toDateString()
    };
  });

  users.forEach(user => {
    const targetDay = chartData.find(d => d._dateStr === user.createdAt.toDateString());
    if (targetDay) targetDay.users += 1;
  });

  return chartData.map(({ _dateStr, ...rest }) => rest);
}

async function getAdminDashboard(req, res, next) {
  try {
    const period = req.query.period || 'year';
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

    const [stats, chartData, tournamentStatusCounts, recentTournaments] = await Promise.all([
      Promise.all([
        User.countDocuments({}),
        Tournament.countDocuments({ status: 'ongoing' }),
        Registration.countDocuments({ status: 'active', 'preCheckResult.status': 'pending' }),
        Race.countDocuments({ status: 'open' }),
      ]),
      period === 'year' ? getUserChartByYear(targetYear)
        : period === 'month' ? getUserChartByMonth(targetYear)
        : getUserChartByWeek(),
      Tournament.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Tournament.find({}).sort({ createdAt: -1 }).limit(5).select('name startDate endDate location status'),
    ]);

    const [totalUsers, ongoingTournaments, activeRegistrations, pendingRaces] = stats;

    const STATUS_LIST = ['upcoming', 'ongoing', 'finished', 'cancelled'];
    const statusMap = Object.fromEntries(tournamentStatusCounts.map((s) => [s._id, s.count]));
    const tournamentChartData = STATUS_LIST.map((status) => ({ name: status, value: statusMap[status] ?? 0 }));

    sendSuccess(res, {
      stats: { totalUsers, ongoingTournaments, activeRegistrations, pendingRaces },
      chartData,
      tournamentChartData,
      upcomingTournaments: recentTournaments,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAdminDashboard };
