const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

function isJockeySuspended(jockeyDoc) {
  const until = jockeyDoc?.jockeyProfile?.suspendedUntil;
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

async function assertJockeyNotSuspended(jockeyId) {
  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey' }).select('fullName jockeyProfile');
  if (!jockey) throw new AppError(404, 'Không tìm thấy nài ngựa');
  if (isJockeySuspended(jockey)) {
    const until = new Date(jockey.jockeyProfile.suspendedUntil).toLocaleString('vi-VN');
    throw new AppError(400, `Nài ngựa đang bị treo giò đến ${until}`);
  }
  return jockey;
}

/**
 * Extend suspension window (never shorten an existing longer ban).
 * @returns {Promise<Date|null>} new suspendedUntil
 */
async function applyJockeySuspension(jockeyId, suspensionDays) {
  const days = Number(suspensionDays);
  if (!Number.isFinite(days) || days <= 0) return null;

  const jockey = await User.findOne({ _id: jockeyId, role: 'jockey' });
  if (!jockey) throw new AppError(404, 'Không tìm thấy nài ngựa để treo giò');

  if (!jockey.jockeyProfile) jockey.jockeyProfile = {};
  const candidate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const existing = jockey.jockeyProfile.suspendedUntil
    ? new Date(jockey.jockeyProfile.suspendedUntil)
    : null;
  const next = existing && existing > candidate ? existing : candidate;
  jockey.jockeyProfile.suspendedUntil = next;
  jockey.markModified('jockeyProfile');
  await jockey.save();
  return next;
}

module.exports = {
  isJockeySuspended,
  assertJockeyNotSuspended,
  applyJockeySuspension,
};
