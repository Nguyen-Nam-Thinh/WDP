const { Tournament } = require('../models/tournament.model');
const { AppError } = require('../middleware/error.middleware');

async function createTournament(adminId, { name, description, location, startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) throw new AppError(400, 'Ngày kết thúc phải sau ngày bắt đầu');

  const tournament = await Tournament.create({
    name,
    description,
    location,
    startDate: start,
    endDate: end,
    createdBy: adminId,
  });

  return tournament.populate('createdBy', 'fullName email');
}

async function getTournaments({ page = 1, limit = 10, status, isActive } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (isActive !== undefined) filter.isActive = isActive;

  const skip = (page - 1) * limit;
  const [tournaments, total] = await Promise.all([
    Tournament.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit),
    Tournament.countDocuments(filter),
  ]);

  return { tournaments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getTournamentById(tournamentId) {
  const tournament = await Tournament.findById(tournamentId).populate('createdBy', 'fullName email');
  if (!tournament) throw new AppError(404, 'Không tìm thấy giải đấu');
  return tournament;
}

async function updateTournament(tournamentId, updates) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new AppError(404, 'Không tìm thấy giải đấu');
  if (!tournament.isActive) throw new AppError(400, 'Giải đấu đã bị vô hiệu hóa');
  if (tournament.status === 'cancelled') throw new AppError(400, 'Không thể cập nhật giải đấu đã hủy');

  // Validate dates if provided
  const start = updates.startDate ? new Date(updates.startDate) : tournament.startDate;
  const end = updates.endDate ? new Date(updates.endDate) : tournament.endDate;
  if (end <= start) throw new AppError(400, 'Ngày kết thúc phải sau ngày bắt đầu');

  // Block if there are running/finished races
  if (updates.startDate || updates.endDate) {
    const { Race } = require('../models/race.model');
    const blockingRace = await Race.findOne({
      tournamentId,
      status: { $in: ['running', 'finished'] },
    });
    if (blockingRace) throw new AppError(409, 'Không thể thay đổi ngày khi đang có cuộc đua diễn ra hoặc đã kết thúc');
  }

  Object.assign(tournament, {
    ...updates,
    startDate: start,
    endDate: end,
  });
  await tournament.save();
  return tournament.populate('createdBy', 'fullName email');
}

async function deleteTournament(tournamentId) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new AppError(404, 'Không tìm thấy giải đấu');
  if (!tournament.isActive) throw new AppError(400, 'Giải đấu đã bị vô hiệu hóa trước đó');

  const { Race } = require('../models/race.model');
  const blockingRace = await Race.findOne({
    tournamentId,
    status: { $in: ['running', 'finished'] },
  });
  if (blockingRace) throw new AppError(409, 'Không thể xóa giải đấu khi đang có cuộc đua diễn ra hoặc đã kết thúc');

  tournament.isActive = false;
  tournament.status = 'cancelled';
  await tournament.save();
  return tournament;
}

module.exports = { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament };
