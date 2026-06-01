const cron = require('node-cron');
const { Race } = require('../models/race.model');
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
      // Set status to 'running' atomically to prevent duplicate starts across ticks
      const racesToStart = await Race.find({
        status: 'pre_check',
        scheduledTime: { $lte: new Date() },
      }).lean();

      for (const race of racesToStart) {
        const updated = await Race.findOneAndUpdate(
          { _id: race._id, status: 'pre_check' },
          { $set: { status: 'running' } },
          { new: false },
        );
        if (!updated) continue; // another process already grabbed it

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
