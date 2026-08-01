# Pre-race Stewards' Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat `preCheckSummary` with a structured Pre-race Stewards' Report on `RefereeReport`, auto-sync Late Scratchings from failed pre-checks, and expose edit UI + PDF with always-visible five sections (empty → `Nil`).

**Architecture:** Embed `preRaceReport` on existing `RefereeReport`. `appendLateScratching` lives in `referee-prerace.helper.js` (called from `updatePreCheck`). Client can edit track/rider/gear/vet; `lateScratchings` are server-owned. Submit requires track condition.

**Tech Stack:** Node.js + Express + Mongoose + Zod (backend); React + MUI (frontend); PDFKit for PDF.

**Spec:** `docs/superpowers/specs/2026-07-31-pre-race-stewards-report-design.md`

## Global Constraints

- Empty sections 2–5 always render as **"Nil"** (never hide headings)
- `lateScratchings` not writable via PATCH
- No undo failed → passed
- Do **not** reuse existing `TRACK_CONDITIONS` in `constants.js` (that object is simulation `dry`/`wet`/`muddy`) — use new export `PRE_RACE_TRACK_CONDITIONS = ['Firm','Good','Soft','Heavy','Synthetic']`
- Backend has **no** Jest/Mocha today — verify with small Node assert scripts + manual API checks, not a new test framework
- Commit messages: `<type>: <description in English, lowercase, no period>`

---

## File Map

| File | Responsibility |
|------|----------------|
| `backend/src/config/constants.js` | Add `PRE_RACE_TRACK_CONDITIONS` |
| `backend/src/models/referee_report.model.js` | `preRaceReport` subdocument + late scratching schema |
| `backend/src/services/referee-prerace.helper.js` | **Create** — `buildLateScratchingLabel`, `appendLateScratching`, `migratePreCheckSummary` |
| `backend/src/services/registration.service.js` | Call append on fail |
| `backend/src/services/referee.service.js` | update/submit/PDF use structured report |
| `backend/src/routes/referee.routes.js` | Zod for `preRaceReport` |
| `frontend/src/app/api/referee.ts` | Types + update payload |
| `frontend/src/app/pages/RefereeDashboard.tsx` | Edit Report dialog |

---

### Task 1: Constants + Mongoose model

**Files:**
- Modify: `backend/src/config/constants.js`
- Modify: `backend/src/models/referee_report.model.js`
- Test: `backend/scripts/verify-prerace-model.js` (create, run, delete after — or keep as smoke script)

**Interfaces:**
- Produces: `PRE_RACE_TRACK_CONDITIONS` array; `RefereeReport.preRaceReport` shape; exports `{ RefereeReport, PRE_RACE_TRACK_CONDITIONS }` from model (re-export from constants also fine)

- [ ] **Step 1: Add constant**

In `backend/src/config/constants.js`, add near other exports (do **not** rename existing simulation `TRACK_CONDITIONS`):

```js
/** Stewards' pre-race report track rating (not simulation track conditions) */
const PRE_RACE_TRACK_CONDITIONS = ['Firm', 'Good', 'Soft', 'Heavy', 'Synthetic'];
```

Export it in `module.exports`.

- [ ] **Step 2: Extend referee report model**

Replace/extend `backend/src/models/referee_report.model.js` to:

```js
const mongoose = require('mongoose');
const { PRE_RACE_TRACK_CONDITIONS } = require('../config/constants');

const lateScratchingSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    note: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true },
    scratchedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const preRaceReportSchema = new mongoose.Schema(
  {
    trackCondition: {
      type: String,
      enum: [...PRE_RACE_TRACK_CONDITIONS, ''],
      default: '',
    },
    trackConditionNote: { type: String, trim: true, default: '' },
    lateScratchings: { type: [lateScratchingSchema], default: [] },
    riderChanges: { type: [String], default: [] },
    gearChanges: { type: [String], default: [] },
    vetChecks: { type: [String], default: [] },
  },
  { _id: false },
);

const incidentSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', default: null },
    type: {
      type: String,
      enum: ['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    action: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const refereeReportSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true, unique: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    incidents: { type: [incidentSchema], default: [] },
    preCheckSummary: { type: String, trim: true, default: '' }, // deprecated — lazy migrate
    preRaceReport: { type: preRaceReportSchema, default: () => ({}) },
    overallNotes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

refereeReportSchema.index({ refereeId: 1 });

const RefereeReport = mongoose.model('RefereeReport', refereeReportSchema);

module.exports = { RefereeReport, PRE_RACE_TRACK_CONDITIONS };
```

- [ ] **Step 3: Smoke-check defaults in Node REPL / one-liner**

From `backend/`:

```bash
node -e "const { PRE_RACE_TRACK_CONDITIONS } = require('./src/config/constants'); const assert = require('assert'); assert.deepEqual(PRE_RACE_TRACK_CONDITIONS, ['Firm','Good','Soft','Heavy','Synthetic']); console.log('ok');"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add backend/src/config/constants.js backend/src/models/referee_report.model.js
git commit -m "$(cat <<'EOF'
feat: add preRaceReport schema to referee report

EOF
)"
```

---

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

### Task 3: Wire `updatePreCheck` → append Late Scratching

**Files:**
- Modify: `backend/src/services/registration.service.js`
- Consumes: `appendLateScratching` from helper

- [ ] **Step 1: Require helper at top of registration.service.js**

```js
const { appendLateScratching } = require('./referee-prerace.helper');
const { Horse } = require('../models/horse.model'); // only if not already imported
```

(Check existing imports — reuse Horse model if already present; otherwise add.)

- [ ] **Step 2: Inside `updatePreCheck`, after successful fail path (inside transaction, after `reg.save`)**

Resolve horse name before/inside transaction:

```js
  // before session block when status === 'failed':
  let horseName = 'Unknown horse';
  if (reg.horseId) {
    const horse = await Horse.findById(reg.horseId).select('name');
    if (horse?.name) horseName = horse.name;
  }
```

After `await reg.save({ session })` and **before** `commitTransaction`:

```js
      await appendLateScratching(
        {
          raceId: race._id,
          refereeId,
          registrationId: reg._id,
          horseId: reg.horseId,
          note: note || '',
          horseName,
        },
        session,
      );
```

If `appendLateScratching` fails, transaction aborts — correct (atomic DQ + report sync).

- [ ] **Step 3: Manual verify (requires running Mongo + seeded race in `pre_check`)**

Call existing pre-check fail endpoint as assigned referee; then:

```js
// In mongosh or a one-off script:
db.refereereports.findOne({ raceId: ObjectId('...') })
// expect preRaceReport.lateScratchings.length >= 1 with label containing horse name
```

If local env unavailable, defer to Task 7 smoke; still commit wiring.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/registration.service.js
git commit -m "$(cat <<'EOF'
feat: sync late scratchings on pre-check failure

EOF
)"
```

---

### Task 4: Referee service — update, submit, migrate, PDF

**Files:**
- Modify: `backend/src/services/referee.service.js`
- Consumes: `migratePreCheckSummary`, `PRE_RACE_TRACK_CONDITIONS`

**Interfaces:**
- `updateReport(reportId, refereeId, { overallNotes, preRaceReport })`
- `submitReport` requires non-empty track in `PRE_RACE_TRACK_CONDITIONS`
- PDF section title: `PRE-RACE STEWARDS' REPORT`

- [ ] **Step 1: Add imports**

```js
const { PRE_RACE_TRACK_CONDITIONS } = require('../config/constants');
const { migratePreCheckSummary } = require('./referee-prerace.helper');
```

- [ ] **Step 2: Replace `updateReport`**

```js
async function updateReport(reportId, refereeId, { overallNotes, preRaceReport }) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Không thể chỉnh sửa báo cáo đã nộp');

  if (migratePreCheckSummary(report)) {
    // persisted with save below
  }

  if (overallNotes !== undefined) report.overallNotes = overallNotes;

  if (preRaceReport && typeof preRaceReport === 'object') {
    if (!report.preRaceReport) report.preRaceReport = {};
    const pr = report.preRaceReport;
    if (preRaceReport.trackCondition !== undefined) {
      pr.trackCondition = preRaceReport.trackCondition;
    }
    if (preRaceReport.trackConditionNote !== undefined) {
      pr.trackConditionNote = preRaceReport.trackConditionNote;
    }
    if (preRaceReport.riderChanges !== undefined) {
      pr.riderChanges = preRaceReport.riderChanges;
    }
    if (preRaceReport.gearChanges !== undefined) {
      pr.gearChanges = preRaceReport.gearChanges;
    }
    if (preRaceReport.vetChecks !== undefined) {
      pr.vetChecks = preRaceReport.vetChecks;
    }
    // intentionally ignore preRaceReport.lateScratchings from client
  }

  await report.save();
  return populateReport(report);
}
```

- [ ] **Step 3: Update `submitReport`**

```js
async function submitReport(reportId, refereeId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Báo cáo đã được nộp trước đó');

  migratePreCheckSummary(report);

  const track = report.preRaceReport?.trackCondition || '';
  if (!PRE_RACE_TRACK_CONDITIONS.includes(track)) {
    throw new AppError(400, 'Track Condition is required before submitting');
  }

  report.status = 'submitted';
  report.submittedAt = new Date();
  await report.save();

  return populateReport(report);
}
```

- [ ] **Step 4: Also migrate on `getReportById` (persist if changed)**

After loading report, before auth return:

```js
  if (migratePreCheckSummary(report)) {
    await report.save();
  }
```

(Apply on the mongoose document before `populateReport`, or migrate after findById on the doc.)

- [ ] **Step 5: Replace PDF pre-check block**

Replace the `PRE-CHECK SUMMARY` section (~lines 263–268) with:

```js
    // ── Pre-race Stewards' Report ──
    const pr = report.preRaceReport || {};
    const nilOrLines = (arr) =>
      (!arr || arr.length === 0) ? 'Nil' : arr.map((x) => `• ${x}`).join('\n');

    let trackText = 'Nil';
    if (pr.trackCondition) {
      trackText = pr.trackConditionNote
        ? `${pr.trackCondition} — ${pr.trackConditionNote}`
        : pr.trackCondition;
    }
    const lateLabels = (pr.lateScratchings || []).map((s) => s.label).filter(Boolean);

    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text("PRE-RACE STEWARDS' REPORT");
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(primaryColor);
    doc.text(`1. Track Condition: ${trackText}`, { width: doc.page.width - 100 });
    doc.moveDown(0.3);
    doc.text('2. Late Scratchings:', { continued: false });
    doc.text(nilOrLines(lateLabels), { width: doc.page.width - 100 });
    doc.moveDown(0.3);
    doc.text('3. Rider Changes:');
    doc.text(nilOrLines(pr.riderChanges), { width: doc.page.width - 100 });
    doc.moveDown(0.3);
    doc.text('4. Gear Changes:');
    doc.text(nilOrLines(pr.gearChanges), { width: doc.page.width - 100 });
    doc.moveDown(0.3);
    doc.text('5. Pre-race Vet Checks:');
    doc.text(nilOrLines(pr.vetChecks), { width: doc.page.width - 100 });
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/referee.service.js
git commit -m "$(cat <<'EOF'
feat: update referee report service for structured pre-race report

EOF
)"
```

---

### Task 5: Zod route validation

**Files:**
- Modify: `backend/src/routes/referee.routes.js`

- [ ] **Step 1: Replace `updateReportSchema`**

```js
const { PRE_RACE_TRACK_CONDITIONS } = require('../config/constants');

const trackEnum = z.enum(PRE_RACE_TRACK_CONDITIONS);

const updateReportSchema = z.object({
  overallNotes: z.string().max(2000).optional(),
  preRaceReport: z.object({
    trackCondition: z.union([trackEnum, z.literal('')]).optional(),
    trackConditionNote: z.string().max(500).optional(),
    riderChanges: z.array(z.string().max(300)).max(50).optional(),
    gearChanges: z.array(z.string().max(300)).max(50).optional(),
    vetChecks: z.array(z.string().max(300)).max(50).optional(),
  }).optional(),
}).refine(
  (d) => d.overallNotes !== undefined || d.preRaceReport !== undefined,
  { message: 'At least one field required' },
);
```

Remove `preCheckSummary` from schema entirely.

- [ ] **Step 2: Quick Zod smoke**

```bash
node -e "const {z}=require('zod'); const TRACK=['Firm','Good','Soft','Heavy','Synthetic']; const trackEnum=z.enum(TRACK); const s=z.object({preRaceReport:z.object({trackCondition:z.union([trackEnum,z.literal('')]).optional()}).optional()}); console.log(s.safeParse({preRaceReport:{trackCondition:'Good'}}).success); console.log(s.safeParse({preRaceReport:{trackCondition:'dry'}}).success);"
```

Expected: `true` then `false`

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/referee.routes.js
git commit -m "$(cat <<'EOF'
feat: validate preRaceReport on referee report update

EOF
)"
```

---

### Task 6: Frontend API types

**Files:**
- Modify: `frontend/src/app/api/referee.ts`

- [ ] **Step 1: Add types and update `RefereeReport` + `updateReport`**

```ts
export type TrackCondition = 'Firm' | 'Good' | 'Soft' | 'Heavy' | 'Synthetic';

export interface LateScratching {
  _id: string;
  registrationId: string;
  horseId: string;
  note: string;
  label: string;
  scratchedAt: string;
}

export interface PreRaceReport {
  trackCondition: TrackCondition | '';
  trackConditionNote: string;
  lateScratchings: LateScratching[];
  riderChanges: string[];
  gearChanges: string[];
  vetChecks: string[];
}

export interface RefereeReport {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; distance: number; purse: number; tournamentId?: string };
  refereeId: { _id: string; fullName: string; email: string; refereeProfile?: { licenseNumber?: string; yearsOfService?: number } };
  incidents: Incident[];
  preRaceReport: PreRaceReport;
  overallNotes: string;
  status: 'draft' | 'submitted';
  submittedAt?: string;
  createdAt: string;
}

export type UpdateRefereeReportPayload = {
  overallNotes?: string;
  preRaceReport?: {
    trackCondition?: TrackCondition | '';
    trackConditionNote?: string;
    riderChanges?: string[];
    gearChanges?: string[];
    vetChecks?: string[];
  };
};
```

Change `updateReport` signature to use `UpdateRefereeReportPayload` (remove `preCheckSummary`).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/api/referee.ts
git commit -m "$(cat <<'EOF'
feat: add preRaceReport types to referee api client

EOF
)"
```

---

### Task 7: RefereeDashboard Edit Report dialog

**Files:**
- Modify: `frontend/src/app/pages/RefereeDashboard.tsx`
- Consumes: `PreRaceReport`, `UpdateRefereeReportPayload`, `refereeApi.updateReport`, `getReportById`

- [ ] **Step 1: Add constants + state near other report state**

```ts
const TRACK_OPTIONS = ['Firm', 'Good', 'Soft', 'Heavy', 'Synthetic'] as const;

const [editReportDialog, setEditReportDialog] = useState(false);
const [editReport, setEditReport] = useState<RefereeReport | null>(null);
const [editTrack, setEditTrack] = useState<string>('');
const [editTrackNote, setEditTrackNote] = useState('');
const [editRiderChanges, setEditRiderChanges] = useState<string[]>([]);
const [editGearChanges, setEditGearChanges] = useState<string[]>([]);
const [editVetChecks, setEditVetChecks] = useState<string[]>([]);
const [editOverallNotes, setEditOverallNotes] = useState('');
const [editLineDraft, setEditLineDraft] = useState({ rider: '', gear: '', vet: '' });
const [savingReport, setSavingReport] = useState(false);
```

Helper:

```ts
const openEditReport = async (report: RefereeReport) => {
  if (!token) return;
  try {
    const full = await refereeApi.getReportById(token, report._id);
    setEditReport(full);
    const pr = full.preRaceReport || {
      trackCondition: '', trackConditionNote: '', lateScratchings: [],
      riderChanges: [], gearChanges: [], vetChecks: [],
    };
    setEditTrack(pr.trackCondition || '');
    setEditTrackNote(pr.trackConditionNote || '');
    setEditRiderChanges([...(pr.riderChanges || [])]);
    setEditGearChanges([...(pr.gearChanges || [])]);
    setEditVetChecks([...(pr.vetChecks || [])]);
    setEditOverallNotes(full.overallNotes || '');
    setEditReportDialog(true);
  } catch (err: any) {
    toast.error(err.message);
  }
};

const handleSaveReport = async () => {
  if (!token || !editReport) return;
  setSavingReport(true);
  try {
    await refereeApi.updateReport(token, editReport._id, {
      overallNotes: editOverallNotes,
      preRaceReport: {
        trackCondition: editTrack as any,
        trackConditionNote: editTrackNote,
        riderChanges: editRiderChanges,
        gearChanges: editGearChanges,
        vetChecks: editVetChecks,
      },
    });
    toast.success('Đã lưu báo cáo');
    setEditReportDialog(false);
    loadReports();
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setSavingReport(false);
  }
};
```

Update `handleSubmitReport` to guard track when submitting from table — prefer loading report or checking cached:

```ts
  const handleSubmitReport = async (reportId: string) => {
    if (!token) return;
    try {
      const full = await refereeApi.getReportById(token, reportId);
      if (!full.preRaceReport?.trackCondition) {
        toast.error('Vui lòng chọn Track Condition trước khi nộp (mở Sửa báo cáo)');
        return;
      }
      await refereeApi.submitReport(token, reportId);
      toast.success('Báo cáo đã được nộp');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
```

- [ ] **Step 2: Add "Sửa" button on draft rows** (beside "+ Sự Cố")

```tsx
<Button size="small" variant="outlined"
  onClick={() => openEditReport(report)}
  sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem' }}>
  Sửa
</Button>
```

Also add **"Xem"** for submitted that opens same dialog read-only (`editReport.status === 'submitted'` → disable fields, hide Save).

- [ ] **Step 3: Add Edit Report Dialog JSX** (match existing Dialog PaperProps style)

Structure:

1. Title: `Chỉnh Sửa Báo Cáo — {raceName}` or `Xem Báo Cáo`
2. Section **1. Track Condition** — Select + TextField note (required hint)
3. Section **2. Late Scratchings** — list `label`s or italic `Nil`
4. Sections **3–5** — list existing lines + TextField + Add button; remove chip/button per line; empty show `Nil`
5. Overall Notes textarea
6. Actions: Đóng / Lưu (draft only)

Always show all five section headings.

- [ ] **Step 4: Manual UI check**

1. Create draft report → Sửa → leave track empty → Save OK  
2. Nộp without track → toast error  
3. Set track Good → Save → Nộp OK  
4. Fail a horse in pre-check → open Sửa → Late Scratchings shows label  
5. Leave rider/gear/vet empty → UI shows Nil; PDF download shows Nil for those sections  

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/RefereeDashboard.tsx
git commit -m "$(cat <<'EOF'
feat: add pre-race stewards report editor on referee dashboard

EOF
)"
```

---

### Task 8: Optional doc sync + final smoke

**Files:**
- Modify (optional): `docs/PRECHECK_VA_BAO_CAO_REFEREE.md` — only if team wants copy-paste doc updated; otherwise skip
- Modify: none required if docs deferred

- [ ] **Step 1: End-to-end smoke checklist**

| # | Check | Pass? |
|---|--------|-------|
| 1 | Fail pre-check creates/updates draft report lateScratchings | |
| 2 | Dedupe same registrationId | |
| 3 | PATCH cannot wipe lateScratchings | |
| 4 | Submit without track → 400 | |
| 5 | Submit with Good → 200 | |
| 6 | PDF has 5 headings + Nil | |
| 7 | Legacy preCheckSummary migrates on get/update | |

- [ ] **Step 2: Commit only if docs changed**

```bash
git add docs/PRECHECK_VA_BAO_CAO_REFEREE.md
git commit -m "$(cat <<'EOF'
docs: sync pre-check referee doc with preRaceReport

EOF
)"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| `preRaceReport` schema + hybrid late scratching | Task 1 |
| `appendLateScratching` helper + circular dep avoidance | Task 2 |
| Auto-sync on `updatePreCheck` failed | Task 3 |
| update/submit/PDF + lazy migrate | Task 4 |
| Zod API | Task 5 |
| FE types | Task 6 |
| Edit dialog + Nil rendering | Task 7 |
| Empty → Nil (rule B) | Tasks 4, 7 |
| No undo DQ | Global Constraints / out of scope |
| Distinct from simulation TRACK_CONDITIONS | Global Constraints + Task 1 |

No TBD placeholders. Types/names consistent: `preRaceReport`, `PRE_RACE_TRACK_CONDITIONS`, `appendLateScratching`, `buildLateScratchingLabel`.
