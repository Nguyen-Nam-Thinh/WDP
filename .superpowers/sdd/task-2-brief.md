### Task 2: Pre-race helper (label + append + migrate)

**Files:**
- Create: `backend/src/services/referee-prerace.helper.js`
- Test: inline assert via `node -e` or `backend/scripts/verify-prerace-helper.js`

**Interfaces:**
- Produces:
  - `buildLateScratchingLabel(horseName: string, note?: string): string`
  - `migratePreCheckSummary(report): boolean` — mutates report in memory; returns whether changed
  - `appendLateScratching({ raceId, refereeId, registrationId, horseId, note, horseName }, session?): Promise<void>`

- [ ] **Step 1: Write helper file**

```js
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
```

- [ ] **Step 2: Verify pure helpers**

```bash
node -e "const assert=require('assert'); const { buildLateScratchingLabel, migratePreCheckSummary }=require('./src/services/referee-prerace.helper'); assert.strictEqual(buildLateScratchingLabel('Thunder','lameness'),'Thunder — lameness'); assert.strictEqual(buildLateScratchingLabel('Thunder',''),'Thunder — Failed pre-check'); const r={preCheckSummary:'old',overallNotes:''}; assert.strictEqual(migratePreCheckSummary(r),true); assert.strictEqual(r.overallNotes,'old'); assert.strictEqual(r.preCheckSummary,''); console.log('ok');"
```

Run from `backend/`. Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/referee-prerace.helper.js
git commit -m "$(cat <<'EOF'
feat: add pre-race stewards late scratching helper

EOF
)"
```

---


