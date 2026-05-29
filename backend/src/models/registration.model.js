const mongoose = require('mongoose');

const preCheckResultSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
    note: { type: String, default: '' },
    checkedAt: { type: Date, default: null },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    feePaid: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'cancelled', 'disqualified'], default: 'active' },
    preCheckResult: { type: preCheckResultSchema, default: () => ({}) },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

registrationSchema.index({ raceId: 1, horseId: 1 }, { unique: true });
registrationSchema.index({ ownerId: 1 });
registrationSchema.index({ raceId: 1, status: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = { Registration };
