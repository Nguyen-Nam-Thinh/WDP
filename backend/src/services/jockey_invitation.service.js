const mongoose = require('mongoose');
const { JockeyInvitation } = require('../models/jockey_invitation.model');
const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { Race } = require('../models/race.model');
const { Wallet } = require('../models/wallet.model');
const { AppError } = require('../middleware/error.middleware');
const { createNotification } = require('./notification.service');
const walletService = require('./wallet.service');

async function createInvitation(ownerId, { jockeyId, horseId, raceId, agreedFee = 0, message }) {
  const [horse, jockey, race] = await Promise.all([
    Horse.findOne({ _id: horseId, ownerId, isActive: true }),
    User.findOne({ _id: jockeyId, role: 'jockey', isActive: true }),
    Race.findById(raceId),
  ]);

  if (!horse) throw new AppError(404, 'Horse not found or access denied');
  if (!jockey) throw new AppError(404, 'Jockey not found');
  if (!race) throw new AppError(404, 'Race not found');
  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(409, 'Cannot invite jockey for a race that has already started or finished');
  }

  const allowedGrades = race.eligibility?.allowedGrades ?? [];
  if (allowedGrades.length > 0 && !allowedGrades.includes(horse.currentGrade)) {
    throw new AppError(409, `Horse grade '${horse.currentGrade}' is not eligible for this race`);
  }

  // Jockey không thể nhận 2 hire cho cùng race
  const doubleBook = await JockeyInvitation.findOne({
    raceId,
    jockeyId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (doubleBook) {
    throw new AppError(409, 'Jockey already has a pending or accepted invitation for this race');
  }

  const existing = await JockeyInvitation.findOne({
    raceId,
    horseId,
    jockeyId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existing) {
    throw new AppError(409, 'A pending invitation already exists for this jockey-horse-race combination');
  }

  const invitation = await JockeyInvitation.create({
    ownerId, jockeyId, horseId, raceId, agreedFee, message,
  });

  createNotification(jockeyId, {
    type: 'invitation_received',
    title: 'Lời mời thuê mới',
    message: `Owner ${horse.name ? '' : ''}gửi lời thuê bạn cưỡi ngựa ${horse.name} trong race "${race.name}" — phí ${agreedFee.toLocaleString('vi-VN')} VNĐ`,
    data: { invitationId: invitation._id, raceId, horseId },
  }).catch(() => {});

  return invitation.populate([
    { path: 'jockeyId', select: 'fullName email jockeyProfile' },
    { path: 'horseId', select: 'name breed gender birthDate weight color primaryImageUrl imageUrls currentGrade totalPoints totalEarnings raceCount winCount' },
    { path: 'raceId', select: 'name grade scheduledTime tournamentId', populate: { path: 'tournamentId', select: 'name' } },
    { path: 'ownerId', select: 'fullName' },
  ]);
}

async function getInvitations(userId, role, { page = 1, limit = 10, status } = {}) {
  const filter = role === 'owner' ? { ownerId: userId } : { jockeyId: userId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [invitations, total] = await Promise.all([
    JockeyInvitation.find(filter)
      .populate('ownerId', 'fullName email avatarUrl')
      .populate('jockeyId', 'fullName email jockeyProfile avatarUrl')
      .populate('horseId', 'name breed gender birthDate weight color primaryImageUrl imageUrls currentGrade totalPoints totalEarnings raceCount winCount')
      .populate({ path: 'raceId', select: 'name grade scheduledTime tournamentId distance status purse registrationFee', populate: { path: 'tournamentId', select: 'name' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    JockeyInvitation.countDocuments(filter),
  ]);

  return { invitations, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getInvitationById(invitationId, userId, role) {
  const invitation = await JockeyInvitation.findById(invitationId)
    .populate('ownerId', 'fullName email')
    .populate('jockeyId', 'fullName email jockeyProfile')
    .populate('horseId', 'name breed gender currentGrade imageUrl')
    .populate({ path: 'raceId', select: 'name grade scheduledTime tournamentId', populate: { path: 'tournamentId', select: 'name' } });

  if (!invitation) throw new AppError(404, 'Invitation not found');

  const isOwner = invitation.ownerId._id.toString() === userId;
  const isJockey = invitation.jockeyId._id.toString() === userId;
  if (!isOwner && !isJockey && role !== 'admin') throw new AppError(403, 'Access denied');

  return invitation;
}

async function acceptInvitation(invitationId, jockeyId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invitation = await JockeyInvitation.findOne({ _id: invitationId, jockeyId }).session(session);
    if (!invitation) throw new AppError(404, 'Invitation not found');
    if (invitation.status !== 'pending') throw new AppError(409, `Cannot accept invitation with status '${invitation.status}'`);

    // Kiểm tra jockey chưa có accepted invitation cho race này
    const conflicting = await JockeyInvitation.findOne({
      _id: { $ne: invitationId },
      raceId: invitation.raceId,
      jockeyId,
      status: 'accepted',
    }).session(session);
    if (conflicting) throw new AppError(409, 'You already have an accepted invitation for this race');

    const agreedFee = invitation.agreedFee ?? 0;

    // Wallet transaction nếu có phí
    if (agreedFee > 0) {
      const [ownerWallet, jockeyWallet] = await Promise.all([
        Wallet.findOne({ userId: invitation.ownerId }).session(session),
        Wallet.findOne({ userId: jockeyId }).session(session),
      ]);
      if (!ownerWallet) throw new AppError(404, 'Owner wallet not found');
      if (!jockeyWallet) throw new AppError(404, 'Jockey wallet not found');

      await walletService.debitWallet(
        ownerWallet._id, invitation.ownerId, agreedFee,
        'jockey_hire_fee',
        `Phí thuê jockey cho race (invitation ${invitation._id})`,
        invitation._id, 'JockeyInvitation',
        session,
      );
      await walletService.creditWallet(
        jockeyWallet._id, jockeyId, agreedFee,
        'jockey_hire_income',
        `Thu nhập từ hợp đồng thuê (invitation ${invitation._id})`,
        invitation._id, 'JockeyInvitation',
        session,
      );
    }

    invitation.status = 'accepted';
    await invitation.save({ session });

    await Horse.findByIdAndUpdate(
      invitation.horseId,
      { $addToSet: { regularJockeys: jockeyId } },
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const populated = await JockeyInvitation.findById(invitationId)
    .populate('jockeyId', 'fullName email jockeyProfile')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName');

  createNotification(populated.ownerId._id ?? populated.ownerId, {
    type: 'invitation_accepted',
    title: 'Jockey đã chấp nhận lời thuê',
    message: `${populated.jockeyId.fullName} đã chấp nhận cưỡi ngựa ${populated.horseId.name}`,
    data: { invitationId },
  }).catch(() => {});

  return populated;
}

async function rejectInvitation(invitationId, jockeyId, rejectionNote) {
  const invitation = await JockeyInvitation.findOne({ _id: invitationId, jockeyId });
  if (!invitation) throw new AppError(404, 'Invitation not found');
  if (invitation.status !== 'pending') throw new AppError(409, `Cannot reject invitation with status '${invitation.status}'`);

  invitation.status = 'rejected';
  if (rejectionNote) invitation.rejectionNote = rejectionNote;
  await invitation.save();

  const populated = await JockeyInvitation.findById(invitationId)
    .populate('jockeyId', 'fullName')
    .populate('horseId', 'name');
  if (populated) {
    createNotification(populated.ownerId, {
      type: 'invitation_rejected',
      title: 'Jockey đã từ chối lời thuê',
      message: `${populated.jockeyId.fullName} đã từ chối cưỡi ngựa ${populated.horseId.name}`,
      data: { invitationId },
    }).catch(() => {});
  }

  return invitation;
}

async function cancelInvitation(invitationId, ownerId) {
  const invitation = await JockeyInvitation.findOne({ _id: invitationId, ownerId });
  if (!invitation) throw new AppError(404, 'Invitation not found');
  if (invitation.status !== 'pending') throw new AppError(409, `Cannot cancel invitation with status '${invitation.status}'`);

  invitation.status = 'cancelled';
  await invitation.save();
  return invitation;
}

// Gọi sau khi race kết thúc — tự động complete tất cả accepted invitations của race đó
// và reset jockey về isAvailable = true
async function completeInvitationsForRace(raceId, session) {
  const accepted = await JockeyInvitation.find({ raceId, status: 'accepted' }).session(session);

  if (accepted.length === 0) return;

  const jockeyIds = [...new Set(accepted.map(inv => inv.jockeyId.toString()))];

  await Promise.all([
    JockeyInvitation.updateMany(
      { raceId, status: 'accepted' },
      { $set: { status: 'completed' } },
      { session },
    ),
    User.updateMany(
      { _id: { $in: jockeyIds }, role: 'jockey' },
      { $set: { 'jockeyProfile.isAvailable': true } },
      { session },
    ),
  ]);
}

// Lấy danh sách jockey sẵn sàng cho thuê (diễn đàn)
async function getAvailableJockeys({ page = 1, limit = 20, style } = {}) {
  const filter = {
    role: 'jockey',
    isActive: true,
    'jockeyProfile.isAvailable': true,
  };
  if (style) filter['jockeyProfile.style'] = style;

  const skip = (page - 1) * limit;
  const [jockeys, total] = await Promise.all([
    User.find(filter)
      .select('fullName avatarUrl jockeyProfile')
      .sort({ 'jockeyProfile.winCount': -1, 'jockeyProfile.experienceYears': -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { jockeys, total, page, limit, totalPages: Math.ceil(total / limit) };
}

module.exports = {
  createInvitation,
  getInvitations,
  getInvitationById,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  completeInvitationsForRace,
  getAvailableJockeys,
};
