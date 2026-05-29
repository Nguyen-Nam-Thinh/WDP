const mongoose = require('mongoose');
const { Schema } = mongoose;

const violationSchema = new Schema(
  {
    name: { type: String, required: true },
    handling: { type: String },
    penaltyDate: { type: Date },
    raceId: { type: Schema.Types.ObjectId, ref: 'Race' },
    note: { type: String },
  },
  { _id: true },
);

const horseSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    birthDate: { type: Date, required: true },
    weight: { type: Number, required: true },
    color: { type: String, trim: true },
    primaryImageUrl: { type: String },
    imageUrls: [{ type: String }],
    currentGrade: {
      type: String,
      enum: ['Maiden', 'G3', 'G2', 'G1'],
      default: 'Maiden',
    },
    totalPoints: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    raceCount: { type: Number, default: 0 },
    winCount: { type: Number, default: 0 },
    regularJockeys: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    violations: [violationSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

horseSchema.index({ ownerId: 1 });
horseSchema.index({ currentGrade: 1, totalPoints: -1 });

const Horse = mongoose.model('Horse', horseSchema);

module.exports = { Horse };
