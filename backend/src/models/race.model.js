const mongoose = require('mongoose');

const eligibilitySchema = new mongoose.Schema(
  {
    allowedGrades: { type: [String], enum: ['Maiden', 'G3', 'G2', 'G1'], default: [] },
    minPoints: { type: Number, default: 0, min: 0 },
    minAge: { type: Number, default: 0, min: 0 },
    maxAge: { type: Number, default: 99, min: 0 },
  },
  { _id: false },
);

const raceSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    grade: { type: String, enum: ['Maiden', 'G3', 'G2', 'G1'], required: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    purse: { type: Number, required: true, min: 0 },
    registrationFee: { type: Number, required: true, min: 0 },
    scheduledTime: { type: Date, required: true },
    cutoffTime: { type: Date, required: true },
    distance: { type: Number, required: true, min: 1 },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['open', 'closed', 'pre_check', 'running', 'finished', 'cancelled'],
      default: 'open',
    },
  },
  { timestamps: true },
);

raceSchema.index({ tournamentId: 1 });
raceSchema.index({ scheduledTime: 1, status: 1 });

const Race = mongoose.model('Race', raceSchema);

module.exports = { Race };
