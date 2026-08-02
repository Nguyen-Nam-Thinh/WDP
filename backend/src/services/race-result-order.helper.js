const { RaceResult } = require('../models/race_result.model');

/**
 * Renumber non-DQ results by provisionalPosition → position 1..k.
 * DQ rows: disqualified=true, position=null.
 */
async function rebuildOfficialOrder(raceId, session) {
  let query = RaceResult.find({ raceId });
  if (session) query = query.session(session);
  const results = await query;

  const nonDq = results
    .filter((r) => !r.disqualified)
    .sort((a, b) => (a.provisionalPosition || 0) - (b.provisionalPosition || 0));

  let currentPos = 1;
  let lastProvPos = null;

  for (let i = 0; i < nonDq.length; i++) {
    const r = nonDq[i];
    if (i === 0) {
      currentPos = 1;
      r.position = currentPos;
      lastProvPos = r.provisionalPosition;
    } else {
      if (r.provisionalPosition === lastProvPos) {
        r.position = currentPos;
      } else {
        currentPos = i + 1;
        r.position = currentPos;
        lastProvPos = r.provisionalPosition;
      }
    }
    await r.save(session ? { session } : {});
  }

  for (const r of results.filter((x) => x.disqualified)) {
    r.position = null;
    await r.save(session ? { session } : {});
  }

  return results;
}

module.exports = { rebuildOfficialOrder };
