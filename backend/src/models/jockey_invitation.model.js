const mongoose = require('mongoose');
const { Schema } = mongoose;

const jockeyInvitationSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jockeyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    horseId: { type: Schema.Types.ObjectId, ref: 'Horse', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    message: { type: String, trim: true },
    rejectionNote: { type: String, trim: true },
  },
  { timestamps: true },
);

// Chỉ cho phép 1 invitation pending/accepted giữa owner-jockey-horse tại một thời điểm
jockeyInvitationSchema.index(
  { horseId: 1, jockeyId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
  },
);
jockeyInvitationSchema.index({ ownerId: 1, createdAt: -1 });
jockeyInvitationSchema.index({ jockeyId: 1, createdAt: -1 });

const JockeyInvitation = mongoose.model('JockeyInvitation', jockeyInvitationSchema);

module.exports = { JockeyInvitation };
