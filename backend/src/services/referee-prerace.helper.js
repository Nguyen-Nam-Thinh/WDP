const { RefereeReport } = require('../models/referee_report.model');

function isReportEditable(status) {
  return status === 'draft' || status === 'rejected';
}

function buildLateScratchingLabel(horseName, note, category) {
  const name = (horseName || 'Unknown horse').trim();
  const reason = (note && String(note).trim()) || 'Failed pre-check';
  const cat = category ? `[${String(category).toUpperCase()}] ` : '';
  return `${name} — ${cat}${reason}`;
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

/** Legacy submitted → pending_approval. Returns true if mutated. */
function migrateSubmittedStatus(report) {
  if (!report || report.status !== 'submitted') return false;
  report.status = 'pending_approval';
  return true;
}

async function appendLateScratching(
  { raceId, refereeId, registrationId, horseId, note, horseName, category },
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

  migrateSubmittedStatus(report);

  if (!isReportEditable(report.status)) return;

  if (!report.preRaceReport) report.preRaceReport = {};
  if (!Array.isArray(report.preRaceReport.lateScratchings)) {
    report.preRaceReport.lateScratchings = [];
  }

  const regIdStr = registrationId.toString();
  const label = buildLateScratchingLabel(horseName, note, category);
  const existing = report.preRaceReport.lateScratchings.find(
    (s) => s.registrationId && s.registrationId.toString() === regIdStr,
  );

  if (existing) {
    existing.note = note || '';
    existing.category = category;
    existing.label = label;
    existing.scratchedAt = new Date();
  } else {
    report.preRaceReport.lateScratchings.push({
      registrationId,
      horseId,
      category,
      note: note || '',
      label,
      scratchedAt: new Date(),
    });
  }

  await report.save(session ? { session } : undefined);
}

async function removeLateScratching({ raceId, registrationId }, session) {
  const query = RefereeReport.findOne({ raceId });
  if (session) query.session(session);
  const report = await query;
  if (!report?.preRaceReport?.lateScratchings?.length) return;

  const regIdStr = registrationId.toString();
  const before = report.preRaceReport.lateScratchings.length;
  report.preRaceReport.lateScratchings = report.preRaceReport.lateScratchings.filter(
    (s) => !(s.registrationId && s.registrationId.toString() === regIdStr),
  );
  if (report.preRaceReport.lateScratchings.length !== before) {
    await report.save(session ? { session } : undefined);
  }
}

/** Create draft report if missing (pre-check complete / live flag). */
async function ensureDraftReportForRace(raceId, refereeId, session) {
  let query = RefereeReport.findOne({ raceId });
  if (session) query = query.session(session);
  let report = await query;
  if (report) return report;

  const docs = await RefereeReport.create(
    [{ raceId, refereeId, status: 'draft' }],
    session ? { session } : undefined,
  );
  return docs[0];
}

module.exports = {
  isReportEditable,
  buildLateScratchingLabel,
  migratePreCheckSummary,
  migrateSubmittedStatus,
  appendLateScratching,
  removeLateScratching,
  ensureDraftReportForRace,
};
