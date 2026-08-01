const { Race } = require('../models/race.model');
const { RefereeReport } = require('../models/referee_report.model');
const { AppError } = require('../middleware/error.middleware');

function isPreRaceEditable(preRaceStatus) {
  const s = preRaceStatus || 'draft';
  return s === 'draft' || s === 'rejected';
}

/**
 * Block race start / force-simulate until Admin approved Pre-race Report.
 */
async function assertPreRaceApprovedForStart(raceId) {
  const race = await Race.findById(raceId).select('name preRaceApproved status');
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  if (race.preRaceApproved) return true;

  const report = await RefereeReport.findOne({ raceId }).select('preRaceStatus').lean();
  if (report?.preRaceStatus === 'approved') {
    await Race.updateOne({ _id: raceId }, { $set: { preRaceApproved: true } });
    return true;
  }

  throw new AppError(400, 'Pre-race Report chưa được Admin duyệt — không thể chạy mô phỏng');
}

module.exports = {
  isPreRaceEditable,
  assertPreRaceApprovedForStart,
};
