const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'race_finished',      // race kết thúc
        'bet_won',            // dự đoán thắng
        'bet_lost',           // dự đoán thua
        'bet_refunded',       // dự đoán hoàn tiền
        'invitation_received',// jockey nhận invitation
        'invitation_accepted',// owner biết jockey accept
        'invitation_rejected',// owner biết jockey reject
        'race_cancelled',     // race bị hủy
        'horse_grade_upgrade',// ngựa lên hạng
        'prize_received',     // nhận tiền thưởng (owner/jockey)
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false, index: true },
    data: { type: Schema.Types.Mixed, default: {} }, // raceId, betId, invitationId, ...
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = model('Notification', notificationSchema);
module.exports = { Notification };
