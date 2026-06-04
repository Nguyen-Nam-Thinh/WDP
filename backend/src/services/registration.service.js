const mongoose = require('mongoose');
const { Registration } = require('../models/registration.model');
const { Race } = require('../models/race.model');
const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { AppError } = require('../middleware/error.middleware');
const { REFUND_RATES } = require('../config/constants');
const { clearPredictionCache } = require('./ai-prediction.service');

function calcHorseAge(birthDate) {
  const now = new Date();
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

async function registerHorse(ownerId, { raceId, horseId, jockeyId }) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');
  if (race.status !== 'open') throw new AppError(400, 'Race is not open for registration');
  if (new Date() > race.cutoffTime) throw new AppError(400, 'Registration cutoff time has passed');

  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Horse not found or access denied');

  // Eligibility checks
  const eligibility = race.eligibility || {};
  if (eligibility.allowedGrades && eligibility.allowedGrades.length > 0) {
    if (!eligibility.allowedGrades.includes(horse.currentGrade)) {
      throw new AppError(400, `Horse grade '${horse.currentGrade}' is not eligible for this race`);
    }
  }
  if (eligibility.minPoints && horse.totalPoints < eligibility.minPoints) {
    throw new AppError(400, `Horse does not meet minimum points requirement (${eligibility.minPoints})`);
  }
  if (horse.birthDate) {
    const age = calcHorseAge(horse.birthDate);
    if (eligibility.minAge && age < eligibility.minAge) {
      throw new AppError(400, `Horse is too young (minimum age: ${eligibility.minAge})`);
    }
    if (eligibility.maxAge && age > eligibility.maxAge) {
      throw new AppError(400, `Horse is too old (maximum age: ${eligibility.maxAge})`);
    }
  }

  // Capacity check
  const activeCount = await Registration.countDocuments({ raceId, status: 'active' });
  if (activeCount >= race.maxCapacity) throw new AppError(409, 'Race has reached maximum capacity');

  // Jockey validation (if provided)
  if (jockeyId) {
    const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
    if (!jockey) throw new AppError(404, 'Jockey not found');

    // Jockey can only ride 1 horse per race
    const jockeyConflict = await Registration.findOne({ raceId, jockeyId, status: 'active' });
    if (jockeyConflict) throw new AppError(409, 'Jockey is already assigned to another horse in this race');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let registration;
  try {
    const wallet = await Wallet.findOne({ userId: ownerId }).session(session);
    if (!wallet) throw new AppError(404, 'Owner wallet not found');

    await walletService.debitWallet(
      wallet._id, ownerId, race.registrationFee,
      'registration_fee',
      `Registration fee: ${race.name}`,
      null, 'Race', session,
    );

    [registration] = await Registration.create(
      [{ raceId, horseId, ownerId, jockeyId: jockeyId || null, feePaid: race.registrationFee }],
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  clearPredictionCache(raceId).catch(() => {});

  return Registration.findById(registration._id)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName email')
    .populate('jockeyId', 'fullName email jockeyProfile');
}

async function getRegistrations(userId, role, { page = 1, limit = 10, raceId, status } = {}) {
  const filter = {};
  if (role === 'owner') filter.ownerId = userId;
  if (raceId) filter.raceId = raceId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .populate('raceId', 'name grade scheduledTime status')
      .populate('horseId', 'name breed gender currentGrade imageUrl')
      .populate('ownerId', 'fullName email')
      .populate('jockeyId', 'fullName email jockeyProfile')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments(filter),
  ]);

  return { registrations, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getRegistrationById(registrationId, userId, role) {
  const reg = await Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime status refereeId')
    .populate('horseId', 'name breed gender currentGrade imageUrl')
    .populate('ownerId', 'fullName email')
    .populate('jockeyId', 'fullName email jockeyProfile');

  if (!reg) throw new AppError(404, 'Registration not found');

  const isOwner = reg.ownerId._id.toString() === userId;
  const isReferee = role === 'referee';
  if (!isOwner && !isReferee && role !== 'admin') throw new AppError(403, 'Access denied');

  return reg;
}

async function assignJockey(registrationId, ownerId, jockeyId) {
  const reg = await Registration.findOne({ _id: registrationId, ownerId });
  if (!reg) throw new AppError(404, 'Registration not found or access denied');
  if (reg.status !== 'active') throw new AppError(400, `Cannot assign jockey to registration with status '${reg.status}'`);

  const race = await Race.findById(reg.raceId);
  if (!race) throw new AppError(404, 'Race not found');
  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, `Cannot assign jockey when race status is '${race.status}'`);
  }

  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
  if (!jockey) throw new AppError(404, 'Jockey not found');

  // Jockey can only ride 1 horse per race (exclude current registration)
  const conflict = await Registration.findOne({
    raceId: reg.raceId,
    jockeyId,
    status: 'active',
    _id: { $ne: registrationId },
  });
  if (conflict) throw new AppError(409, 'Jockey is already assigned to another horse in this race');

  reg.jockeyId = jockeyId;
  await reg.save();

  return Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName email')
    .populate('jockeyId', 'fullName email jockeyProfile');
}

async function cancelRegistration(registrationId, ownerId) {
  const reg = await Registration.findOne({ _id: registrationId, ownerId });
  if (!reg) throw new AppError(404, 'Registration not found or access denied');
  if (reg.status !== 'active') throw new AppError(400, `Cannot cancel registration with status '${reg.status}'`);

  const race = await Race.findById(reg.raceId);
  if (!race) throw new AppError(404, 'Race not found');
  if (race.status !== 'open') throw new AppError(400, 'Can only cancel registration while race is open');

  const refundAmount = Math.floor(reg.feePaid * REFUND_RATES.ownerCancel);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (refundAmount > 0) {
      const wallet = await Wallet.findOne({ userId: ownerId }).session(session);
      if (!wallet) throw new AppError(404, 'Wallet not found');
      await walletService.creditWallet(
        wallet._id, ownerId, refundAmount,
        'registration_refund',
        `Refund (40%): cancelled registration for ${race.name}`,
        reg._id, 'Registration', session,
      );
    }

    reg.status = 'cancelled';
    reg.cancelledAt = new Date();
    reg.refundAmount = refundAmount;
    await reg.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  clearPredictionCache(reg.raceId).catch(() => {});

  return Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime')
    .populate('horseId', 'name breed gender currentGrade');
}

async function updatePreCheck(registrationId, refereeId, { status, note }) {
  const reg = await Registration.findById(registrationId).populate('raceId');
  if (!reg) throw new AppError(404, 'Registration not found');

  const race = reg.raceId;
  if (race.status !== 'pre_check') throw new AppError(400, 'Race must be in pre_check status for inspection');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Only the assigned referee can perform pre-check');
  }
  if (reg.status !== 'active') throw new AppError(400, `Registration is already ${reg.status}`);

  reg.preCheckResult = { status, note: note || '', checkedAt: new Date() };

  if (status === 'failed') {
    const refundAmount = Math.floor(reg.feePaid * REFUND_RATES.disqualifyOwner);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (refundAmount > 0) {
        const wallet = await Wallet.findOne({ userId: reg.ownerId }).session(session);
        if (!wallet) throw new AppError(404, 'Wallet not found');
        await walletService.creditWallet(
          wallet._id, reg.ownerId, refundAmount,
          'registration_refund',
          `Refund (70%): disqualified pre-check for ${race.name}`,
          reg._id, 'Registration', session,
        );
      }

      reg.status = 'disqualified';
      reg.refundAmount = refundAmount;
      await reg.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    await reg.save();
  }

  return Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName email');
}

module.exports = {
  registerHorse, getRegistrations, getRegistrationById,
  assignJockey, cancelRegistration, updatePreCheck,
};
