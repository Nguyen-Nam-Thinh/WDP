const cron = require('node-cron');
const { Race } = require('../models/race.model');
const { CRON_INTERVALS } = require('../config/constants');

function startRaceStatusJob() {
  // Runs every 30 seconds — auto-closes races whose cutoffTime has passed
  cron.schedule(`*/${CRON_INTERVALS.raceCheckSeconds} * * * * *`, async () => {
    try {
      const result = await Race.updateMany(
        { status: 'open', cutoffTime: { $lte: new Date() } },
        { $set: { status: 'closed' } },
      );
      if (result.modifiedCount > 0) {
        console.log(`[cron] Auto-closed ${result.modifiedCount} race(s)`);
      }
    } catch (err) {
      console.error('[cron] raceStatus job error:', err.message);
    }
  });

  console.log('[cron] Race status job started (every 30s)');
}

module.exports = { startRaceStatusJob };
