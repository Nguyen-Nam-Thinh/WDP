const mongoose = require('mongoose');
const { Schema } = mongoose;

const jockeyProfileSchema = new Schema(
  {
    experienceYears: { type: Number, default: 0 },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    winCount: { type: Number, default: 0 },
    raceCount: { type: Number, default: 0 },
    bio: { type: String },
    style: {
      type: String,
      enum: ['aggressive', 'balanced', 'conservative'],
      default: 'balanced',
    },
  },
  { _id: false },
);

const refereeProfileSchema = new Schema(
  {
    licenseNumber: { type: String, required: true },
    yearsOfService: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ['owner', 'jockey', 'referee', 'spectator', 'admin'],
      required: true,
    },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet' },
    jockeyProfile: { type: jockeyProfileSchema },
    refereeProfile: { type: refereeProfileSchema },
    refreshToken: { type: String, select: false },
    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = { User };
