const mongoose = require('mongoose');

const raceResultSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    position: { type: Number, required: true, min: 1 },
    finishTime: { type: Number, default: null },
    prizeAmount: { type: Number, default: 0, min: 0 },
    pointsEarned: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

raceResultSchema.index({ raceId: 1, position: 1 });
raceResultSchema.index({ horseId: 1, createdAt: -1 });

const RaceResult = mongoose.model('RaceResult', raceResultSchema);

module.exports = { RaceResult };
