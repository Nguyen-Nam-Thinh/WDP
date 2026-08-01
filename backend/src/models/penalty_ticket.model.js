const mongoose = require('mongoose');

const penaltyTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'RefereeReport', required: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', default: null },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['open', 'paid', 'waived'], default: 'open' },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

penaltyTicketSchema.index({ userId: 1, status: 1 });
penaltyTicketSchema.index({ raceId: 1 });
penaltyTicketSchema.index({ incidentId: 1 }, { unique: true });

const PenaltyTicket = mongoose.model('PenaltyTicket', penaltyTicketSchema);

module.exports = { PenaltyTicket };
