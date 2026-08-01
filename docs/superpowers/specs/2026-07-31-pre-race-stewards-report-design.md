# Pre-race Stewards' Report — Design Spec

> **Date:** 2026-07-31  
> **Project:** HRTMS-AI (G07)  
> **Status:** Approved in design review (Approach 1 + decisions A/B/C below)  
> **Related:** UC-R3 (pre-check), UC-R7/R8 (referee report + PDF)

---

## 1. Problem

Referee pre-check (`updatePreCheck`) only updates `Registration.preCheckResult`.  
`RefereeReport` stores a flat `preCheckSummary: String` and does **not** produce a standardized Pre-race Stewards' Report for the race.

When a horse fails pre-check, the system refunds/DQ but does **not** log a Late Scratching into the report.  
`RefereeDashboard` has no UI for Track Condition or the five stewards sections.

## 2. Decisions (locked)

| Topic | Choice |
|-------|--------|
| Architecture | **Approach 1** — embed `preRaceReport` on existing `RefereeReport` (1 race = 1 report) |
| Empty sections 2–5 | **B** — always render all 5 headings; empty → `"Nil"` |
| Late Scratching shape | **C** — object with `registrationId` + `horseId` + `note` + snapshot `label` |
| Track Condition input | **C** — enum select + optional free-text note |
| Legacy `preCheckSummary` | **C** — lazy migrate into `overallNotes`, stop accepting on new API |
| Undo failed → passed | **Out of scope** — current system is one-way DQ; no undo in this feature |

## 3. Architecture

```
updatePreCheck(failed)
  → refund + registration.status = disqualified
  → appendLateScratching(raceId, …)   // findOrCreate draft report

PATCH /referee/reports/:id
  → update overallNotes + editable preRaceReport fields
  → lateScratchings NOT writable by client

POST .../submit
  → require trackCondition ∈ enum

GET .../pdf + FE dialog
  → always print 5 sections; empty arrays → "Nil"
```

**Circular dependency:** put `appendLateScratching` in a small helper  
`backend/src/services/referee-prerace.helper.js` so `registration.service` does not require the full `referee.service`.

## 4. Data Model

**File:** `backend/src/models/referee_report.model.js`

```js
const TRACK_CONDITIONS = ['Firm', 'Good', 'Soft', 'Heavy', 'Synthetic'];

const lateScratchingSchema = new mongoose.Schema(
  {
    registrationId: { type: ObjectId, ref: 'Registration', required: true },
    horseId: { type: ObjectId, ref: 'Horse', required: true },
    note: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true }, // e.g. "Thunder Bolt — lameness"
    scratchedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const preRaceReportSchema = new mongoose.Schema(
  {
    trackCondition: {
      type: String,
      enum: [...TRACK_CONDITIONS, ''],
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
```

On `refereeReportSchema`:

- Add `preRaceReport: { type: preRaceReportSchema, default: () => ({}) }`
- Keep `preCheckSummary` temporarily (deprecated)
- Lazy migrate on read/update: if `preCheckSummary` has text and `overallNotes` is empty → copy to `overallNotes`, clear `preCheckSummary`
- New API must **not** accept `preCheckSummary`

Export `TRACK_CONDITIONS` (or put in `config/constants`) for Zod reuse.

## 5. Service Layer

### 5.1 `appendLateScratching` (helper)

Inputs: `{ raceId, refereeId, registrationId, horseId, note, horseName }`, optional `session`.

Behavior:

1. `findOne({ raceId })`; if missing → `create` draft `{ raceId, refereeId, preRaceReport: {} }`
2. If report `status === 'submitted'` → **skip** (do not mutate locked report)
3. Dedupe by `registrationId`: if exists → update `note`/`label`; else push
4. `label = \`${horseName} — ${note || 'Failed pre-check'}\``

### 5.2 `registration.service` — `updatePreCheck`

When `status === 'failed'`, after refund/DQ (same session preferred):

- Resolve horse name
- Call `appendLateScratching(...)`
- Do not touch rider/gear/vet fields

Pre-check remains one-way: `reg.status !== 'active'` still blocks re-check.

### 5.3 `updateReport`

Accept:

```ts
{
  overallNotes?: string;
  preRaceReport?: {
    trackCondition?: 'Firm'|'Good'|'Soft'|'Heavy'|'Synthetic'|'';
    trackConditionNote?: string;
    riderChanges?: string[];
    gearChanges?: string[];
    vetChecks?: string[];
  }
}
```

- Reject if `submitted`
- Lazy-migrate `preCheckSummary`
- Partial merge on `preRaceReport`; **ignore** any client-sent `lateScratchings`

### 5.4 `submitReport`

Require `preRaceReport.trackCondition` in `TRACK_CONDITIONS` (non-empty).  
Else `400` with message: Track Condition is required before submitting.

### 5.5 PDF (`generateReportPdf`)

Replace `PRE-CHECK SUMMARY` block with:

```
PRE-RACE STEWARDS' REPORT
1. Track Condition: <value> [— note] | Nil if empty*
2. Late Scratchings: labels list | Nil
3. Rider Changes: lines | Nil
4. Gear Changes: lines | Nil
5. Vet Checks: lines | Nil
```

\*Submit gate normally prevents empty track on submitted PDFs; draft PDF may still show Nil.

Always print all five headings (rule B).

## 6. API Validation

**File:** `backend/src/routes/referee.routes.js`

```js
const TRACK = z.enum(['Firm', 'Good', 'Soft', 'Heavy', 'Synthetic']);

const updateReportSchema = z.object({
  overallNotes: z.string().max(2000).optional(),
  preRaceReport: z.object({
    trackCondition: TRACK.or(z.literal('')).optional(),
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

Remove `preCheckSummary` from schema. Controllers stay thin; routes unchanged except validation body.

## 7. Frontend

### 7.1 Types / client — `frontend/src/app/api/referee.ts`

- Add `TrackCondition`, `LateScratching`, `PreRaceReport`
- Extend `RefereeReport` with `preRaceReport`
- Drop `preCheckSummary` from FE types (or mark optional unused)
- `updateReport` payload: `overallNotes?` + `preRaceReport?` without `lateScratchings`

### 7.2 UI — `RefereeDashboard.tsx` Reports tab

Current gap: no edit form for report fields (only Create / Incident / Submit / PDF).

Add **"Sửa"** on draft rows → Dialog **Chỉnh Sửa Báo Cáo**:

| Section | Control | Editable |
|---------|---------|----------|
| Track Condition | Select enum + note TextField | Yes (required before submit) |
| Late Scratchings | Read-only `label` list; empty → `Nil` | No |
| Rider Changes | Add/remove string lines | Yes |
| Gear Changes | Same | Yes |
| Vet Checks | Same | Yes |
| Overall Notes | Textarea | Yes |

- Save → `PATCH` (track may still be empty while draft)
- Submit: client toast if missing track; server also enforces
- Submitted: read-only view of same 5 sections + PDF
- Helper: `displayOrNil(items)` — always show five headings

After pre-check fail, BE owns sync; opening edit dialog / refreshing reports shows new late scratching.

## 8. Error Handling

| Case | Behavior |
|------|----------|
| Fail pre-check, no report yet | Create draft then append |
| Fail pre-check, report submitted | Skip append (log optional); DQ/refund still succeed |
| Duplicate fail same registration | Update existing late scratching entry |
| Submit without trackCondition | 400 |
| Client sends `lateScratchings` | Ignored (or strip in Zod by omission) |
| Edit submitted report | 400 unchanged |

## 9. Testing (minimum)

1. Model: report defaults `preRaceReport` empty arrays / empty track
2. `updatePreCheck(failed)` creates draft + one late scratching with correct `label`
3. Second fail same reg does not duplicate
4. `updateReport` merges rider/gear/vet; cannot clear lateScratchings via PATCH
5. `submitReport` rejects empty track; accepts with `Good`
6. PDF contains all five headings; empty sections print `Nil`
7. Lazy migrate: old `preCheckSummary` moves to `overallNotes`

## 10. Out of Scope

- Undo DQ / restore `failed` → `passed`
- Spectator bet refund on DQ (existing known gap in CLAUDE.md)
- Separate `pre_race_reports` collection
- Changing race status flow

## 11. Files to Touch

| File | Change |
|------|--------|
| `backend/src/models/referee_report.model.js` | Schema + export constants |
| `backend/src/services/referee-prerace.helper.js` | **Create** — append helper |
| `backend/src/services/registration.service.js` | Call helper on fail |
| `backend/src/services/referee.service.js` | update/submit/PDF/migrate |
| `backend/src/routes/referee.routes.js` | Zod schema |
| `frontend/src/app/api/referee.ts` | Types + update payload |
| `frontend/src/app/pages/RefereeDashboard.tsx` | Edit dialog UI |
| `docs/PRECHECK_VA_BAO_CAO_REFEREE.md` | Optional follow-up doc sync |

## 12. Success Criteria

- Failed pre-check auto-appears under Late Scratchings on the race’s draft report
- Referee can set Track Condition (+ note) and optional rider/gear/vet lines
- Submit blocked without Track Condition
- UI + PDF always show 5 sections; empties show `Nil`
- Legacy `preCheckSummary` does not break old draft reports (lazy migrate)
