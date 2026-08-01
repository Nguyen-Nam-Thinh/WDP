const cron = require('node-cron');
const { Race } = require('../models/race.model');
const { RefereeReport } = require('../models/referee_report.model');
const { CRON_INTERVALS } = require('../config/constants');
const { runRaceSimulation } = require('../services/race-simulation.service');

function startRaceStatusJob() {
  cron.schedule(`*/${CRON_INTERVALS.raceCheckSeconds} * * * * *`, async () => {
    try {
      // 1. Auto-close open races past cutoffTime
      const closed = await Race.updateMany(
        { status: 'open', cutoffTime: { $lte: new Date() } },
        { $set: { status: 'closed' } },
      );
      if (closed.modifiedCount > 0) {
        console.log(`[cron] Auto-closed ${closed.modifiedCount} race(s)`);
      }

      // 2. Auto-start simulation for pre_check races past scheduledTime
      //    ONLY if Pre-race Report has been approved by admin
      const racesToStart = await Race.find({
        status: 'pre_check',
        scheduledTime: { $lte: new Date() },
      }).lean();

      for (const race of racesToStart) {
        let approved = !!race.preRaceApproved;
        if (!approved) {
          const report = await RefereeReport.findOne({ raceId: race._id }).select('preRaceStatus').lean();
          approved = report?.preRaceStatus === 'approved';
          if (approved) {
            await Race.updateOne({ _id: race._id }, { $set: { preRaceApproved: true } });
          }
        }
        if (!approved) {
          console.log(`[cron] Skip race "${race.name}" — Pre-race Report chưa được duyệt`);
          continue;
        }

        const updated = await Race.findOneAndUpdate(
          { _id: race._id, status: 'pre_check' },
          { $set: { status: 'running' } },
          { new: false },
        );
        if (!updated) continue;

        console.log(`[cron] Starting simulation for race "${race.name}" (${race._id})`);
        runRaceSimulation(race._id).catch((err) => {
          console.error(`[simulation] Race ${race._id} failed:`, err.message);
        });
      }
    } catch (err) {
      console.error('[cron] raceStatus job error:', err.message);
    }
  });

  console.log('[cron] Race status job started (every 30s)');
}

module.exports = { startRaceStatusJob };
