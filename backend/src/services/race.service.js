const mongoose = require('mongoose');
const { Race } = require('../models/race.model');
const { Tournament } = require('../models/tournament.model');
const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const { CUTOFFS, REFUND_RATES } = require('../config/constants');

const ALLOWED_MANUAL_TRANSITIONS = {
  open: 'closed',
  closed: 'pre_check',
};

async function createRace(adminId, body) {
  const {
    tournamentId, name, grade, maxCapacity, purse, registrationFee,
    scheduledTime, cutoffTime, distance, eligibility,
  } = body;

  const tournament = await Tournament.findOne({ _id: tournamentId, isActive: true });
  if (!tournament) throw new AppError(404, 'Không tìm thấy giải đấu');
  if (tournament.status === 'cancelled') throw new AppError(400, 'Giải đấu đã bị hủy');

  const scheduled = new Date(scheduledTime);
  const cutoff = new Date(cutoffTime);

  if (cutoff >= scheduled) throw new AppError(400, 'Thời hạn đăng ký phải trước thời gian đua');

  const minCutoffMs = CUTOFFS.registrationHoursMin * 60 * 60 * 1000;
  if (scheduled - cutoff < minCutoffMs) {
    throw new AppError(400, `Thời hạn đăng ký phải sớm hơn giờ đua ít nhất ${CUTOFFS.registrationHoursMin} tiếng`);
  }

  const race = await Race.create({
    tournamentId,
    name,
    grade,
    maxCapacity,
    purse,
    registrationFee,
    scheduledTime: scheduled,
    cutoffTime: cutoff,
    distance,
    eligibility: eligibility || {},
  });

  return race.populate('tournamentId', 'name status');
}

async function getRaces({ page = 1, limit = 10, tournamentId, grade, status } = {}) {
  const filter = {};
  if (tournamentId) filter.tournamentId = tournamentId;
  if (grade) filter.grade = grade;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [races, total] = await Promise.all([
    Race.find(filter)
      .populate('tournamentId', 'name status')
      .populate('refereeId', 'fullName email')
      .sort({ scheduledTime: 1 })
      .skip(skip)
      .limit(limit),
    Race.countDocuments(filter),
  ]);

  return { races, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getRaceById(raceId) {
  const race = await Race.findById(raceId)
    .populate('tournamentId', 'name status startDate endDate')
    .populate('refereeId', 'fullName email refereeProfile');
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  return race;
}

async function updateRace(raceId, updates) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, `Không thể cập nhật cuộc đua đang ở trạng thái '${race.status}'`);
  }

  // Re-validate timing if changed
  const scheduled = updates.scheduledTime ? new Date(updates.scheduledTime) : race.scheduledTime;
  const cutoff = updates.cutoffTime ? new Date(updates.cutoffTime) : race.cutoffTime;

  if (cutoff >= scheduled) throw new AppError(400, 'Thời hạn đăng ký phải trước thời gian đua');

  const minCutoffMs = CUTOFFS.registrationHoursMin * 60 * 60 * 1000;
  if (scheduled - cutoff < minCutoffMs) {
    throw new AppError(400, `Thời hạn đăng ký phải sớm hơn giờ đua ít nhất ${CUTOFFS.registrationHoursMin} tiếng`);
  }

  // Prevent direct status change via this endpoint
  delete updates.status;

  Object.assign(race, updates, { scheduledTime: scheduled, cutoffTime: cutoff });
  await race.save();
  return race.populate('tournamentId', 'name status');
}

async function cancelRace(raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status === 'cancelled') throw new AppError(400, 'Cuộc đua đã bị hủy trước đó');
  if (['running', 'finished'].includes(race.status)) {
    throw new AppError(400, `Không thể hủy cuộc đua đang ở trạng thái '${race.status}'`);
  }

  const { Registration } = require('../models/registration.model');
  const walletService = require('./wallet.service');
  const { Wallet } = require('../models/wallet.model');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    race.status = 'cancelled';
    await race.save({ session });

    const activeRegistrations = await Registration.find({ raceId, status: 'active' }).session(session);

    for (const reg of activeRegistrations) {
      if (reg.feePaid > 0) {
        const refundAmount = Math.floor(reg.feePaid * REFUND_RATES.cancelled);
        const wallet = await Wallet.findOne({ userId: reg.ownerId }).session(session);
        if (wallet) {
          await walletService.creditWallet(
            wallet._id, reg.ownerId, refundAmount,
            'registration_refund',
            `Refund: race cancelled (${race.name})`,
            reg._id, 'Registration', session,
          );
        }
        reg.refundAmount = refundAmount;
      }
      reg.status = 'cancelled';
      reg.cancelledAt = new Date();
      await reg.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return Race.findById(raceId).populate('tournamentId', 'name status');
}

async function assignReferee(raceId, refereeId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status === 'cancelled') throw new AppError(400, 'Không thể phân công trọng tài cho cuộc đua đã hủy');

  const referee = await User.findOne({ _id: refereeId, role: 'referee', isActive: true });
  if (!referee) throw new AppError(404, 'Không tìm thấy trọng tài');

  race.refereeId = refereeId;
  await race.save();
  return race.populate('refereeId', 'fullName email refereeProfile');
}

async function updateRaceStatus(raceId, newStatus) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const expected = ALLOWED_MANUAL_TRANSITIONS[race.status];
  if (expected !== newStatus) {
    throw new AppError(400, `Không thể chuyển trạng thái từ '${race.status}' sang '${newStatus}'`);
  }

  if (newStatus === 'pre_check') {
    // Phải có trọng tài được phân công
    if (!race.refereeId) {
      throw new AppError(400, 'Phải phân công trọng tài trước khi chuyển sang giai đoạn kiểm tra');
    }

    // Phải có ít nhất 2 ngựa đã đăng ký (status active)
    const { Registration } = require('../models/registration.model');
    const activeCount = await Registration.countDocuments({ raceId, status: 'active' });
    if (activeCount < 2) {
      throw new AppError(
        400,
        `Cần ít nhất 2 ngựa đăng ký để bắt đầu kiểm tra trước race (hiện có ${activeCount} ngựa)`
      );
    }
  }

  race.status = newStatus;
  await race.save();
  return race.populate('tournamentId', 'name status');
}

async function getRaceRegistrations(raceId, { page = 1, limit = 20 } = {}) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const { Registration } = require('../models/registration.model');
  const skip = (page - 1) * limit;
  const [registrations, total] = await Promise.all([
    Registration.find({ raceId })
      .populate('horseId', 'name breed gender currentGrade totalPoints imageUrl')
      .populate('ownerId', 'fullName email')
      .populate('jockeyId', 'fullName email jockeyProfile')
      .sort({ registeredAt: 1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments({ raceId }),
  ]);

  return { registrations, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Public endpoint — only exposes horse/jockey info for betting (no owner/fee data)
async function getRaceHorses(raceId) {
  const race = await Race.findById(raceId)
    .populate('tournamentId', 'name')
    .populate('refereeId', 'fullName');
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const { Registration } = require('../models/registration.model');
  const registrations = await Registration.find({ raceId, status: 'active' })
    .populate('horseId', 'name breed gender currentGrade totalPoints winCount raceCount imageUrl')
    .populate('jockeyId', 'fullName jockeyProfile')
    .sort({ registeredAt: 1 });

  const horses = registrations.map(reg => ({
    registrationId: reg._id,
    horseId: reg.horseId?._id,
    horseName: reg.horseId?.name,
    breed: reg.horseId?.breed,
    gender: reg.horseId?.gender,
    currentGrade: reg.horseId?.currentGrade,
    totalPoints: reg.horseId?.totalPoints,
    winRate: reg.horseId?.raceCount > 0
      ? Math.round((reg.horseId.winCount / reg.horseId.raceCount) * 100)
      : 0,
    imageUrl: reg.horseId?.imageUrl,
    jockeyId: reg.jockeyId?._id || null,
    jockeyName: reg.jockeyId?.fullName || null,
    jockeyExperience: reg.jockeyId?.jockeyProfile?.experienceYears || 0,
  }));

  return {
    race: {
      _id: race._id,
      name: race.name,
      grade: race.grade,
      distance: race.distance,
      purse: race.purse,
      registrationFee: race.registrationFee,
      scheduledTime: race.scheduledTime,
      cutoffTime: race.cutoffTime,
      status: race.status,
      tournament: race.tournamentId,
    },
    horses,
    total: horses.length,
  };
}

// Admin force-start: auto-pass pending registrations + run simulation immediately
async function forceSimulateRace(raceId) {
  const { Registration } = require('../models/registration.model');
  const { runRaceSimulation } = require('./race-simulation.service');

  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status === 'finished' || race.status === 'cancelled') {
    throw new AppError(400, `Cuộc đua đã ở trạng thái ${race.status}`);
  }

  // Auto-pass all active registrations still pending pre-check
  await Registration.updateMany(
    { raceId, status: 'active', 'preCheckResult.status': 'pending' },
    { $set: { 'preCheckResult.status': 'passed', 'preCheckResult.checkedAt': new Date() } },
  );

  // Ensure race is in running status
  await Race.findByIdAndUpdate(raceId, { $set: { status: 'running' } });

  // Fire simulation async (non-blocking — client waits for socket events)
  runRaceSimulation(raceId).catch((err) =>
    console.error(`[force-simulate] Race ${raceId} failed:`, err.message),
  );

  return { message: 'Simulation started', raceId };
}

async function getRaceResults(raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const { RaceResult } = require('../models/race_result.model');
  const results = await RaceResult.find({ raceId })
    .populate('horseId', 'name breed currentGrade primaryImageUrl')
    .populate('jockeyId', 'fullName jockeyProfile')
    .sort({ position: 1 });

  return { race, results };
}

module.exports = {
  createRace, getRaces, getRaceById, updateRace,
  cancelRace, assignReferee, updateRaceStatus, getRaceRegistrations, getRaceHorses,
  getRaceResults, forceSimulateRace,
};
