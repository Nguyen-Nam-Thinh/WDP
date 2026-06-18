const mongoose = require('mongoose');
const { Schema } = mongoose;

const jockeyInvitationSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jockeyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    horseId: { type: Schema.Types.ObjectId, ref: 'Horse', required: true },
    raceId: { type: Schema.Types.ObjectId, ref: 'Race', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    agreedFee: { type: Number, default: 0, min: 0 },
    message: { type: String, trim: true },
    rejectionNote: { type: String, trim: true },
  },
  { timestamps: true },
);

// 1 jockey chỉ có 1 invitation active cho cùng horse + race
jockeyInvitationSchema.index(
  { raceId: 1, horseId: 1, jockeyId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
  },
);
jockeyInvitationSchema.index({ ownerId: 1, createdAt: -1 });
jockeyInvitationSchema.index({ jockeyId: 1, createdAt: -1 });

const JockeyInvitation = mongoose.model('JockeyInvitation', jockeyInvitationSchema);

module.exports = { JockeyInvitation };
