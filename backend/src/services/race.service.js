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
  if (!tournament) throw new AppError(404, 'Tournament not found');
  if (tournament.status === 'cancelled') throw new AppError(400, 'Tournament is cancelled');

  const scheduled = new Date(scheduledTime);
  const cutoff = new Date(cutoffTime);

  if (cutoff >= scheduled) throw new AppError(400, 'cutoffTime must be before scheduledTime');

  const minCutoffMs = CUTOFFS.registrationHoursMin * 60 * 60 * 1000;
  if (scheduled - cutoff < minCutoffMs) {
    throw new AppError(400, `cutoffTime must be at least ${CUTOFFS.registrationHoursMin}h before scheduledTime`);
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
  if (!race) throw new AppError(404, 'Race not found');
  return race;
}

async function updateRace(raceId, updates) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');

  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, `Cannot update race with status '${race.status}'`);
  }

  // Re-validate timing if changed
  const scheduled = updates.scheduledTime ? new Date(updates.scheduledTime) : race.scheduledTime;
  const cutoff = updates.cutoffTime ? new Date(updates.cutoffTime) : race.cutoffTime;

  if (cutoff >= scheduled) throw new AppError(400, 'cutoffTime must be before scheduledTime');

  const minCutoffMs = CUTOFFS.registrationHoursMin * 60 * 60 * 1000;
  if (scheduled - cutoff < minCutoffMs) {
    throw new AppError(400, `cutoffTime must be at least ${CUTOFFS.registrationHoursMin}h before scheduledTime`);
  }

  // Prevent direct status change via this endpoint
  delete updates.status;

  Object.assign(race, updates, { scheduledTime: scheduled, cutoffTime: cutoff });
  await race.save();
  return race.populate('tournamentId', 'name status');
}

async function cancelRace(raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');
  if (race.status === 'cancelled') throw new AppError(400, 'Race is already cancelled');
  if (['running', 'finished'].includes(race.status)) {
    throw new AppError(400, `Cannot cancel race with status '${race.status}'`);
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
  if (!race) throw new AppError(404, 'Race not found');
  if (race.status === 'cancelled') throw new AppError(400, 'Cannot assign referee to cancelled race');

  const referee = await User.findOne({ _id: refereeId, role: 'referee', isActive: true });
  if (!referee) throw new AppError(404, 'Referee not found');

  race.refereeId = refereeId;
  await race.save();
  return race.populate('refereeId', 'fullName email refereeProfile');
}

async function updateRaceStatus(raceId, newStatus) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');

  const expected = ALLOWED_MANUAL_TRANSITIONS[race.status];
  if (expected !== newStatus) {
    throw new AppError(400, `Cannot transition from '${race.status}' to '${newStatus}'`);
  }

  race.status = newStatus;
  await race.save();
  return race.populate('tournamentId', 'name status');
}

async function getRaceRegistrations(raceId, { page = 1, limit = 20 } = {}) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');

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
  if (!race) throw new AppError(404, 'Race not found');

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

module.exports = {
  createRace, getRaces, getRaceById, updateRace,
  cancelRace, assignReferee, updateRaceStatus, getRaceRegistrations, getRaceHorses,
};
