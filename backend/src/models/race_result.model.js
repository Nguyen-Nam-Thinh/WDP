const mongoose = require('mongoose');

const raceResultSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    /** Official/display place; null when disqualified */
    position: { type: Number, min: 1, default: null },
    /** Immutable simulation finish order */
    provisionalPosition: { type: Number, min: 1, required: true },
    disqualified: { type: Boolean, default: false },
    finishTime: { type: Number, default: null },
    prizeAmount: { type: Number, default: 0, min: 0 },
    pointsEarned: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

raceResultSchema.index({ raceId: 1, position: 1 });
raceResultSchema.index({ horseId: 1, createdAt: -1 });
raceResultSchema.index({ raceId: 1, registrationId: 1 }, { unique: true });

const RaceResult = mongoose.model('RaceResult', raceResultSchema);

module.exports = { RaceResult };
