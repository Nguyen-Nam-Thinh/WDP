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

  let pos = 1;
  for (const r of nonDq) {
    r.position = pos++;
    await r.save(session ? { session } : undefined);
  }

  for (const r of results.filter((x) => x.disqualified)) {
    r.position = null;
    await r.save(session ? { session } : undefined);
  }

  return results;
}

module.exports = { rebuildOfficialOrder };
