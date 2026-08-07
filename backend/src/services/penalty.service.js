const mongoose = require('mongoose');
const { PenaltyTicket } = require('../models/penalty_ticket.model');
const { Wallet } = require('../models/wallet.model');
const walletService = require('./wallet.service');
const { AppError } = require('../middleware/error.middleware');
const { createNotification } = require('./notification.service');

async function listMyPenalties(userId, { status } = {}) {
  const filter = { userId };
  if (status) filter.status = status;
  const tickets = await PenaltyTicket.find(filter)
    .populate('raceId', 'name grade scheduledTime status isOfficial')
    .populate('horseId', 'name')
    .sort({ createdAt: -1 });
  return tickets;
}

async function payPenalty(ticketId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticket = await PenaltyTicket.findById(ticketId).session(session);
    if (!ticket) throw new AppError(404, 'Không tìm thấy phiếu phạt');
    if (ticket.userId.toString() !== userId.toString()) {
      throw new AppError(403, 'Bạn không phải người phải nộp phạt này');
    }
    if (ticket.status !== 'open') {
      throw new AppError(400, `Phiếu phạt đã ở trạng thái ${ticket.status}`);
    }

    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new AppError(404, 'Không tìm thấy ví');

    await walletService.debitWallet(
      wallet._id,
      userId,
      ticket.amount,
      'penalty_payment',
      `Nộp phạt steward`,
      ticket._id,
      'PenaltyTicket',
      session,
    );

    ticket.status = 'paid';
    ticket.paidAt = new Date();
    await ticket.save({ session });

    await session.commitTransaction();
    return ticket;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function createFineTicket(payload, session) {
  const docs = await PenaltyTicket.create([payload], session ? { session } : undefined);
  const ticket = docs[0];
  try {
    await createNotification(ticket.userId, {
      type: 'penalty_issued',
      title: 'Bạn có phiếu phạt steward',
      message: `Phạt ${ticket.amount.toLocaleString('vi-VN')} coins — bấm thông báo để vào nộp phạt`,
      data: { ticketId: ticket._id, raceId: ticket.raceId, openPenalties: true },
    });
  } catch { /* optional */ }
  return ticket;
}

async function listAllPenalties({ page = 1, limit = 20, status, raceId }) {
  const query = {};
  if (status) query.status = status;
  if (raceId) query.raceId = raceId;

  const [total, sumResult] = await Promise.all([
    PenaltyTicket.countDocuments(query),
    PenaltyTicket.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ])
  ]);
  const totalAmount = sumResult[0]?.totalAmount || 0;

  const tickets = await PenaltyTicket.find(query)
    .populate('userId', 'fullName email')
    .populate('raceId', 'name grade scheduledTime status isOfficial')
    .populate('horseId', 'name currentGrade')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    tickets,
    total,
    totalAmount,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { listMyPenalties, payPenalty, createFineTicket, listAllPenalties };
