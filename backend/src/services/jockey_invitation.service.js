const mongoose = require('mongoose');
const { JockeyInvitation } = require('../models/jockey_invitation.model');
const { Horse } = require('../models/horse.model');
const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

async function createInvitation(ownerId, { jockeyId, horseId, message }) {
  const horse = await Horse.findOne({ _id: horseId, ownerId, isActive: true });
  if (!horse) throw new AppError(404, 'Horse not found or access denied');

  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey', isActive: true });
  if (!jockey) throw new AppError(404, 'Jockey not found');

  // Kiểm tra đã tồn tại invitation pending/accepted chưa
  const existing = await JockeyInvitation.findOne({
    horseId,
    jockeyId,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existing) {
    const msg = existing.status === 'accepted'
      ? 'Jockey is already a regular jockey for this horse'
      : 'A pending invitation already exists for this jockey-horse pair';
    throw new AppError(409, msg);
  }

  const invitation = await JockeyInvitation.create({ ownerId, jockeyId, horseId, message });
  return invitation.populate([
    { path: 'jockeyId', select: 'fullName email jockeyProfile' },
    { path: 'horseId', select: 'name breed gender currentGrade' },
  ]);
}

async function getInvitations(userId, role, { page = 1, limit = 10, status } = {}) {
  const filter = role === 'owner' ? { ownerId: userId } : { jockeyId: userId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [invitations, total] = await Promise.all([
    JockeyInvitation.find(filter)
      .populate('ownerId', 'fullName email')
      .populate('jockeyId', 'fullName email jockeyProfile')
      .populate('horseId', 'name breed gender currentGrade imageUrl')
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
    .populate('horseId', 'name breed gender currentGrade imageUrl');

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

    invitation.status = 'accepted';
    await invitation.save({ session });

    await Horse.findByIdAndUpdate(
      invitation.horseId,
      { $addToSet: { regularJockeys: invitation.jockeyId } },
      { session },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // Fresh query after session ends to avoid MongoExpiredSessionError on populate
  return JockeyInvitation.findById(invitationId)
    .populate('jockeyId', 'fullName email jockeyProfile')
    .populate('horseId', 'name breed gender currentGrade');
}

async function rejectInvitation(invitationId, jockeyId, rejectionNote) {
  const invitation = await JockeyInvitation.findOne({ _id: invitationId, jockeyId });
  if (!invitation) throw new AppError(404, 'Invitation not found');
  if (invitation.status !== 'pending') throw new AppError(409, `Cannot reject invitation with status '${invitation.status}'`);

  invitation.status = 'rejected';
  if (rejectionNote) invitation.rejectionNote = rejectionNote;
  await invitation.save();
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

module.exports = {
  createInvitation,
  getInvitations,
  getInvitationById,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
};
