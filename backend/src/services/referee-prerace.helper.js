const { RefereeReport } = require('../models/referee_report.model');

function buildLateScratchingLabel(horseName, note) {
  const name = (horseName || 'Unknown horse').trim();
  const reason = (note && String(note).trim()) || 'Failed pre-check';
  return `${name} — ${reason}`;
}

/** Lazy migrate deprecated preCheckSummary → overallNotes. Returns true if mutated. */
function migratePreCheckSummary(report) {
  if (!report) return false;
  const legacy = (report.preCheckSummary || '').trim();
  if (!legacy) return false;
  if (!(report.overallNotes || '').trim()) {
    report.overallNotes = legacy;
  }
  report.preCheckSummary = '';
  return true;
}

async function appendLateScratching(
  { raceId, refereeId, registrationId, horseId, note, horseName },
  session,
) {
  const query = RefereeReport.findOne({ raceId });
  if (session) query.session(session);
  let report = await query;

  if (!report) {
    const docs = await RefereeReport.create(
      [{ raceId, refereeId, status: 'draft' }],
      session ? { session } : undefined,
    );
    report = docs[0];
  }

  if (report.status === 'submitted') return;

  if (!report.preRaceReport) report.preRaceReport = {};
  if (!Array.isArray(report.preRaceReport.lateScratchings)) {
    report.preRaceReport.lateScratchings = [];
  }

  const regIdStr = registrationId.toString();
  const label = buildLateScratchingLabel(horseName, note);
  const existing = report.preRaceReport.lateScratchings.find(
    (s) => s.registrationId && s.registrationId.toString() === regIdStr,
  );

  if (existing) {
    existing.note = note || '';
    existing.label = label;
    existing.scratchedAt = new Date();
  } else {
    report.preRaceReport.lateScratchings.push({
      registrationId,
      horseId,
      note: note || '',
      label,
      scratchedAt: new Date(),
    });
  }

  await report.save(session ? { session } : undefined);
}

module.exports = {
  buildLateScratchingLabel,
  migratePreCheckSummary,
  appendLateScratching,
};
