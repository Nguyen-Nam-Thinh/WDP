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
      `Nộp phạt steward — ticket ${ticket._id}`,
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

module.exports = { listMyPenalties, payPenalty, createFineTicket };
