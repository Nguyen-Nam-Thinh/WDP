const mongoose = require('mongoose');
const { Registration } = require('../models/registration.model');
const { Race } = require('../models/race.model');
const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { AppError } = require('../middleware/error.middleware');
const { REFUND_RATES, PRE_CHECK_FAIL_CATEGORIES } = require('../config/constants');
const { clearPredictionCache } = require('./ai-prediction.service');
const { appendLateScratching, removeLateScratching } = require('./referee-prerace.helper');

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
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'open') throw new AppError(400, 'Cuộc đua không còn mở đăng ký');
  if (new Date() > race.cutoffTime) throw new AppError(400, 'Đã qua thời hạn đăng ký');

  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Không tìm thấy ngựa hoặc bạn không có quyền truy cập');

  // Eligibility checks
  const GRADE_ORDER = { Maiden: 0, G3: 1, G2: 2, G1: 3 };
  const eligibility = race.eligibility || {};

  if (eligibility.allowedGrades && eligibility.allowedGrades.length > 0) {
    if (!eligibility.allowedGrades.includes(horse.currentGrade)) {
      throw new AppError(400, `Hạng ngựa '${horse.currentGrade}' không đủ điều kiện. Chỉ chấp nhận: ${eligibility.allowedGrades.join(', ')}`);
    }
  } else {
    // Default: horse grade must be >= race grade
    if ((GRADE_ORDER[horse.currentGrade] ?? -1) < (GRADE_ORDER[race.grade] ?? 0)) {
      throw new AppError(400, `Hạng ngựa '${horse.currentGrade}' không đủ điều kiện tham gia giải ${race.grade}`);
    }
  }

  if (eligibility.minPoints > 0 && horse.totalPoints < eligibility.minPoints) {
    throw new AppError(400, `Ngựa không đủ điểm tối thiểu (${horse.totalPoints}/${eligibility.minPoints} điểm)`);
  }
  if (horse.birthDate) {
    const age = calcHorseAge(horse.birthDate);
    if (eligibility.minAge && age < eligibility.minAge) {
      throw new AppError(400, `Ngựa còn quá nhỏ (tuổi tối thiểu: ${eligibility.minAge})`);
    }
    if (eligibility.maxAge && age > eligibility.maxAge) {
      throw new AppError(400, `Ngựa đã quá tuổi (tuổi tối đa: ${eligibility.maxAge})`);
    }
  }

  // Capacity check
  const activeCount = await Registration.countDocuments({ raceId, status: 'active' });
  if (activeCount >= race.maxCapacity) throw new AppError(409, 'Cuộc đua đã đủ số lượng ngựa đăng ký');

  // Jockey validation (if provided)
  if (jockeyId) {
    const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
    if (!jockey) throw new AppError(404, 'Không tìm thấy kỵ sĩ');
    const { assertJockeyNotSuspended } = require('./jockey-suspension.helper');
    await assertJockeyNotSuspended(jockeyId);

    // Jockey can only ride 1 horse per race
    const jockeyConflict = await Registration.findOne({ raceId, jockeyId, status: 'active' });
    if (jockeyConflict) throw new AppError(409, 'Kỵ sĩ đã được phân công cho ngựa khác trong cuộc đua này');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let registration;
  try {
    const wallet = await Wallet.findOne({ userId: ownerId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví của chủ ngựa');

    await walletService.debitWallet(
      wallet._id, ownerId, race.registrationFee,
      'registration_fee',
      `Phí đăng ký: ${race.name}`,
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

  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');

  const isOwner = reg.ownerId._id.toString() === userId;
  const isReferee = role === 'referee';
  if (!isOwner && !isReferee && role !== 'admin') throw new AppError(403, 'Bạn không có quyền truy cập');

  return reg;
}

async function assignJockey(registrationId, ownerId, jockeyId) {
  const reg = await Registration.findOne({ _id: registrationId, ownerId });
  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký hoặc bạn không có quyền truy cập');
  if (reg.status !== 'active') throw new AppError(400, `Không thể phân công kỵ sĩ cho đăng ký có trạng thái '${reg.status}'`);

  const race = await Race.findById(reg.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, `Không thể phân công kỵ sĩ khi cuộc đua đang ở trạng thái '${race.status}'`);
  }

  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
  if (!jockey) throw new AppError(404, 'Không tìm thấy kỵ sĩ');

  const { assertJockeyNotSuspended } = require('./jockey-suspension.helper');
  await assertJockeyNotSuspended(jockeyId);

  // Jockey can only ride 1 horse per race (exclude current registration)
  const conflict = await Registration.findOne({
    raceId: reg.raceId,
    jockeyId,
    status: 'active',
    _id: { $ne: registrationId },
  });
  if (conflict) throw new AppError(409, 'Kỵ sĩ đã được phân công cho ngựa khác trong cuộc đua này');

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
  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký hoặc bạn không có quyền truy cập');
  if (reg.status !== 'active') throw new AppError(400, `Không thể hủy đăng ký có trạng thái '${reg.status}'`);

  const race = await Race.findById(reg.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'open') throw new AppError(400, 'Chỉ có thể hủy đăng ký khi cuộc đua còn đang mở');

  const refundAmount = Math.floor(reg.feePaid * REFUND_RATES.ownerCancel);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (refundAmount > 0) {
      const wallet = await Wallet.findOne({ userId: ownerId }).session(session);
      if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
      await walletService.creditWallet(
        wallet._id, ownerId, refundAmount,
        'registration_refund',
        `Hoàn tiền (40%): hủy đăng ký cuộc đua ${race.name}`,
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

async function maybeMarkStewardsReady(raceId, session) {
  let query = Registration.find({
    raceId,
    status: { $in: ['active', 'disqualified'] },
  });
  if (session) query = query.session(session);
  const regs = await query;

  if (regs.length === 0) return;

  const allDone = regs.every((r) => {
    const s = r.preCheckResult?.status;
    return s === 'passed' || s === 'failed';
  });
  if (!allDone) return;

  let raceQuery = Race.findById(raceId);
  if (session) raceQuery = raceQuery.session(session);
  const race = await raceQuery;
  if (!race) return;

  if (!race.stewardsReady) {
    race.stewardsReady = true;
    await race.save(session ? { session } : undefined);
  }

  if (race.refereeId) {
    const { ensureDraftReportForRace } = require('./referee-prerace.helper');
    await ensureDraftReportForRace(raceId, race.refereeId, session);
  }
}

async function updatePreCheck(registrationId, refereeId, { status, note, category }) {
  const reg = await Registration.findById(registrationId).populate('raceId');
  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');

  const race = reg.raceId;
  if (race.status !== 'pre_check') throw new AppError(400, 'Cuộc đua phải ở trạng thái kiểm tra trước đua');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Chỉ trọng tài được phân công mới có thể thực hiện kiểm tra');
  }
  if (!['active', 'disqualified'].includes(reg.status)) {
    throw new AppError(400, `Đăng ký đã ở trạng thái ${reg.status}`);
  }

  if (status === 'failed') {
    if (!category || !PRE_CHECK_FAIL_CATEGORIES.includes(category)) {
      throw new AppError(400, 'Cần chọn phân loại khi đánh Không Đạt');
    }
  }

  const prevStatus = reg.preCheckResult?.status;
  const resolvedCategory = status === 'failed' ? category : null;

  // failed → passed: khôi phục đăng ký + thu lại hoàn phí (nếu có)
  if (status === 'passed' && (prevStatus === 'failed' || reg.status === 'disqualified')) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const refundToClaw = reg.refundAmount || 0;
      if (refundToClaw > 0) {
        const wallet = await Wallet.findOne({ userId: reg.ownerId }).session(session);
        if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
        if (wallet.balance < refundToClaw) {
          throw new AppError(400, 'Số dư chủ ngựa không đủ để thu lại hoàn phí khi đổi sang Đạt');
        }
        await walletService.debitWallet(
          wallet._id, reg.ownerId, refundToClaw,
          'registration_fee',
          `Thu lại hoàn phí: đổi Không Đạt → Đạt (${race.name})`,
          reg._id, 'Registration', session,
        );
      }

      reg.status = 'active';
      reg.refundAmount = 0;
      reg.preCheckResult = {
        status: 'passed',
        category: null,
        note: note || '',
        checkedAt: new Date(),
      };
      await reg.save({ session });

      await removeLateScratching({ raceId: race._id, registrationId: reg._id }, session);
      await maybeMarkStewardsReady(race._id, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return Registration.findById(registrationId)
      .populate('raceId', 'name grade scheduledTime status stewardsReady')
      .populate('horseId', 'name breed gender currentGrade')
      .populate('ownerId', 'fullName email');
  }

  reg.preCheckResult = {
    status,
    category: resolvedCategory,
    note: note || '',
    checkedAt: new Date(),
  };

  if (status === 'failed') {
    let horseName = 'Unknown horse';
    if (reg.horseId) {
      const horse = await Horse.findById(reg.horseId).select('name');
      if (horse?.name) horseName = horse.name;
    }

    const alreadyDq = reg.status === 'disqualified';
    const refundAmount = alreadyDq
      ? (reg.refundAmount || 0)
      : Math.floor(reg.feePaid * REFUND_RATES.disqualifyOwner);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!alreadyDq && refundAmount > 0) {
        const wallet = await Wallet.findOne({ userId: reg.ownerId }).session(session);
        if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
        await walletService.creditWallet(
          wallet._id, reg.ownerId, refundAmount,
          'registration_refund',
          `Hoàn tiền (70%): ngựa bị loại kiểm tra trước đua ${race.name}`,
          reg._id, 'Registration', session,
        );
      }

      reg.status = 'disqualified';
      if (!alreadyDq) reg.refundAmount = refundAmount;
      await reg.save({ session });

      await appendLateScratching(
        {
          raceId: race._id,
          refereeId,
          registrationId: reg._id,
          horseId: reg.horseId,
          note: note || '',
          horseName,
          category: resolvedCategory,
        },
        session,
      );

      await maybeMarkStewardsReady(race._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    await reg.save();
    await maybeMarkStewardsReady(race._id);
  }

  return Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime status stewardsReady')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName email');
}

module.exports = {
  registerHorse, getRegistrations, getRegistrationById,
  assignJockey, cancelRegistration, updatePreCheck,
};
