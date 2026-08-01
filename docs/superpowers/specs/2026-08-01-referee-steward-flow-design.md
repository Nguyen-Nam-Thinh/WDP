# Referee Steward Flow Redesign — Design Spec

> **Date:** 2026-08-01  
> **Project:** HRTMS-AI (G07)  
> **Status:** Design approved (Approach 1 — 4 slices)  
> **Branch context:** Builds on Pre-race Stewards' Report (`feat/pre-race-stewards-report` / related work)  
> **Commit policy:** Implementation changes stay uncommitted until the human author commits.

---

## 1. Problem

Referee FR spans Pre-race / In-race / Post-race, but the current system only partially covers it:

- Pre-check is pass/fail with a free-text note — no fail **category**, no structured stewards phase on the race.
- Report lifecycle is only `draft | submitted` — no admin approve/reject, no `isOfficial`.
- No live **Flag** UX during simulation (only a heavy incident form).
- UC-R6 Confirm results is documented but not implemented.
- Post-race “resolution” (warning / fine / DQ) is not modeled without side effects.

This spec defines a hybrid steward flow that **does not replace** the locked race status machine in `CLAUDE.md`.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Race status machine | **Keep** `open → closed → pre_check → running → finished` (+ `cancelled`) |
| Stewards phase (DB) | **Hybrid C:** add boolean/auxiliary fields only (`stewardsReady`, `isOfficial`, confirm timestamps) — do not invent Ready/Ongoing/Official as `race.status` |
| Stewards phase (UX) | **Hybrid A:** auto `stewardsReady` when all active regs are pre-checked; `isOfficial` when admin **approves** report |
| Fail category storage | **Both** `Registration.preCheckResult.category` and snapshot on `lateScratchings[]` |
| Pre-race Report timing | Flexible (create/edit like today); Late Scratchings sync on fail; Track Condition required on submit |
| In-race Flag | Reuse `incidents` as **draft** minimal records |
| Auto collision from simulation | **Out of scope** this phase |
| Post-race verdict | Store on incident; **superseded for money/order:** see `2026-08-01-deferred-payout-official-results-design.md` (DQ re-ranks; Fine → PenaltyTicket) |
| Report submit / admin | Upgrade C: `draft → pending_approval → approved \| rejected`; no separate submissions collection; no summary snapshot |
| Payout timing | **SUPERSEDED:** settle on Admin **approve** (not on `finished`) — see deferred-payout design |
| Implementation approach | **Approach 1:** 4 slices (steward UX) + follow-on payout slices in deferred-payout spec |
| Git | Implementer **does not commit**; human commits |

> **Amendment 2026-08-01:** Payout + DQ/Fine economic effects are defined in  
> `docs/superpowers/specs/2026-08-01-deferred-payout-official-results-design.md`.  
> Sections 5.4 and 7.2 below that say approve must not settle / DQ is documentary-only are **obsolete**.

---

## 3. Architecture overview

```
PRE-RACE                          IN-RACE                         POST-RACE
────────                          ───────                         ─────────
race.status = pre_check           race.status = running           race.status = finished
Pass / Fail(+category)            Flag → incident draft           Confirm results (sign-off)
Late Scratching sync              (no typing)                     Resolve incidents (verdict)
auto stewardsReady=true                                           Submit report → pending_approval
Edit Pre-race Report                                              Admin approve → isOfficial=true
  (track / rider / gear / vet)                                    Admin reject → rejected (edit+resubmit)
```

**Notifications:** On submit → notify admins if notification module exists; otherwise stub/skip without blocking.

---

## 4. Slice 1 — Fail category + Late Scratching + `stewardsReady`

### 4.1 Data model

**`Registration.preCheckResult`**
```js
{
  status: 'pending' | 'passed' | 'failed',
  category: 'veterinary' | 'jockey' | 'gear' | 'administrative' | null, // required when failed
  note: String,
  checkedAt: Date | null,
}
```

**`RefereeReport.preRaceReport.lateScratchings[]`** (extend existing)
```js
{
  registrationId, horseId, note, label, scratchedAt,
  category: 'veterinary' | 'jockey' | 'gear' | 'administrative',
}
```
Label example: `"Thunder — [VETERINARY] lameness front right"`

**`Race`**
```js
stewardsReady: { type: Boolean, default: false },
isOfficial: { type: Boolean, default: false }, // written in Slice 2; field may be added in Slice 1
```

Constants (new, do not collide with simulation `TRACK_CONDITIONS`):
```js
PRE_CHECK_FAIL_CATEGORIES = ['veterinary', 'jockey', 'gear', 'administrative']
```

### 4.2 API / service

`PATCH /registrations/:id/pre-check`

| Body | Behavior |
|------|----------|
| `{ status: 'passed', note? }` | Immediate update; `category` cleared/null |
| `{ status: 'failed', category, note? }` | `category` required → else 400; DQ + 70% refund; `appendLateScratching` with category; then `maybeMarkStewardsReady(raceId)` |

`maybeMarkStewardsReady(raceId)`:
- Consider registrations that are still candidates for the race (typically `status: 'active'` awaiting check, or all non-cancelled that must be checked).
- Rule: every registration that was `active` at start of pre-check has `preCheckResult.status` in `passed|failed` (failed regs become `disqualified`).
- Practical rule: no remaining `active` registration with `preCheckResult.status === 'pending'`.
- Then set `race.stewardsReady = true`.

Passed path: no confirmation modal required (FE calls API immediately).

### 4.3 UI

- **Đạt:** call API immediately.
- **Không Đạt:** modal with Category dropdown (required) + Note (optional) → confirm.
- Hint: Rider/Gear changes belong on Draft Pre-race Report, not on pre-check.

### 4.4 Out of Slice 1

Report approval, live flag, verdict UI, admin screens.

---

## 5. Slice 2 — Report approval + `isOfficial`

### 5.1 Report status machine

```
draft → pending_approval → approved
              ↓
          rejected → (edit) → pending_approval → …
```

| Status | Meaning |
|--------|---------|
| `draft` | Referee editing |
| `pending_approval` | Submitted, awaiting admin |
| `rejected` | Admin rejected; referee may edit and resubmit |
| `approved` | Locked; race marked official |

**Legacy migrate:** existing `submitted` → treat as `pending_approval` (lazy on read or one-off script).

### 5.2 Fields on `RefereeReport`

```js
status: 'draft' | 'pending_approval' | 'rejected' | 'approved',
submittedBy: ObjectId ref User,
submittedAt: Date,
reviewedBy: ObjectId ref User,
reviewedAt: Date,
rejectReason: String, default '',
```

No `report_submissions` collection. No denormalized count snapshot — admin `GET` full report and UI counts `lateScratchings` / `incidents`.

### 5.3 APIs

**Referee**
- `POST /referee/reports/:id/submit`
  - Allowed from `draft` or `rejected`
  - Requires `preRaceReport.trackCondition` in `PRE_RACE_TRACK_CONDITIONS`
  - Sets `pending_approval`, `submittedBy`, `submittedAt`; clear or keep `rejectReason` (clear on resubmit)
  - Optional admin notification

**Admin**
- `GET /admin/referee-reports?status=pending_approval`
- `GET /admin/referee-reports/:id`
- `POST /admin/referee-reports/:id/approve` → `approved` + `reviewedBy/At` + `race.isOfficial = true`
- `POST /admin/referee-reports/:id/reject` `{ reason }` → `rejected` + `reviewedBy/At` + `rejectReason`

**Edit rules**
- Mutate report / incidents / preRace only when `draft` or `rejected`
- `pending_approval` / `approved`: read + PDF only

### 5.4 Payout

Approve **must not** call settle/prize/bet logic. Settlement remains on race `finished` (existing engine).

### 5.5 UI

- Referee: badges Nháp / Chờ duyệt / Từ chối / Đã duyệt; show `rejectReason` when rejected.
- Admin: list pending, detail view from full GET, Approve / Reject.

---

## 6. Slice 3 — Live Flag → draft incident

### 6.1 Incident schema extensions

```js
{
  // existing: registrationId, horseId, type, description, action, recordedAt
  source: 'manual' | 'live_flag',      // default 'manual'
  status: 'draft' | 'resolved',        // live_flag starts as draft; manual may start resolved
  raceTimeMs: Number | null,
  flaggedAt: Date | null,
}
```

**Live flag payload (server-built):**
```js
{
  source: 'live_flag',
  status: 'draft',
  type: 'other',
  description: 'Flagged during race',
  action: '',
  horseId, registrationId,
  flaggedAt: now,
  raceTimeMs: optional,
  recordedAt: now,
}
```

### 6.2 API

`POST /referee/reports/:id/incidents/flag`  
Body: `{ registrationId }` or `{ horseId }` (must belong to report’s race)

- Race must be `running`
- Report must be editable (`draft` | `rejected`); else findOrCreate draft report for race
- No client `description`
- Optional debounce: same horse within 5s → ignore or refresh `flaggedAt`

Existing `POST .../incidents` remains for full manual incidents / post-race edits.

### 6.3 UI

- New referee live view (tab/route), join `race:{raceId}`
- Per-horse **Flag** button — no text modal
- Toast with horse + timestamp; side list of draft flags
- Auto collision events: **out of scope**

---

## 7. Slice 4 — Confirm results + incident resolution

### 7.1 Confirm results (UC-R6)

**Race fields:**
```js
resultsConfirmedAt: Date | null,
resultsConfirmedBy: ObjectId ref User | null,
```

`POST /referee/races/:raceId/confirm-results`
- Race `finished`; caller is assigned referee
- Idempotent if already confirmed
- Does **not** set `isOfficial`; does **not** re-settle

UI: post-race results table + **Xác nhận kết quả**. Photofinish imagery: optional/placeholder, not required.

### 7.2 Resolve incident

`PATCH /referee/reports/:id/incidents/:incidentId/resolve`

```ts
{
  type?: IncidentType,
  description?: string,
  action?: string,
  resolution: {
    verdict: 'none' | 'warning' | 'fine' | 'disqualified',
    fineAmount?: number,  // required > 0 if fine; stored only
    note?: string
  }
}
```

```js
resolution: {
  verdict: 'none' | 'warning' | 'fine' | 'disqualified',
  fineAmount: Number,
  note: String,
  resolvedAt: Date,
}
// sets incident.status = 'resolved'
```

- Editable only while report `draft` | `rejected`
- `disqualified` verdict is documentary only in this phase (no `race_results` / registration mutation)

### 7.3 Suggested post-race order

> **Amended 2026-08-01:** Full post-race Inquiry / Performance / Vet / suspension →  
> `docs/superpowers/specs/2026-08-01-post-race-reports-design.md`.

1. View results → Confirm results  
2. Fill Inquiry on draft flags / incidents  
3. Resolve (verdict + reasonCode + optional suspension)  
4. Edit `postRaceReport` (performance explanations + vet orders)  
5. Finish Pre-race report fields if needed  
6. Submit → `pending_approval` (all incidents must be resolved)  
7. Admin approve → `isOfficial` + payout (deferred-payout spec)

---

## 8. Error handling (cross-slice)

| Case | Behavior |
|------|----------|
| Fail without category | 400 |
| Submit without track condition | 400 |
| Edit while `pending_approval` / `approved` | 400 |
| Flag while race not `running` | 400 |
| Approve non-pending report | 400 |
| Reject without reason | 400 (recommend required non-empty reason) |
| Confirm results on non-finished / wrong referee | 403/400 |

---

## 9. Out of scope (all slices)

- Changing core `race.status` enum to Ready/Ongoing/Official
- Simulation auto-collision incidents
- Fine debiting wallet / DQ changing official order / re-settling bets
- Undo failed → passed pre-check
- Photofinish media pipeline
- Separate `report_submissions` collection / count snapshots

---

## 10. Files likely touched (by slice)

| Slice | Files (indicative) |
|-------|-------------------|
| 1 | `registration.model.js`, `referee_report.model.js`, `race.model.js`, `constants.js`, `registration.service.js`, `referee-prerace.helper.js`, `registration.routes.js`, `RefereeDashboard.tsx`, FE registration API |
| 2 | `referee_report.model.js`, `referee.service.js`, `referee.routes.js`, new admin report routes/controller/service, Admin UI page, `RefereeDashboard.tsx`, `referee.ts` |
| 3 | `referee_report.model.js`, `referee.service.js`, `referee.routes.js`, new live referee UI + socket join, `referee.ts` |
| 4 | `race.model.js`, `referee.service.js`, routes, resolve UI in report editor, confirm-results UI |

---

## 11. Success criteria

1. Failed pre-check requires category; Late Scratching stores category + label; `stewardsReady` flips when pre-check complete.  
2. Report can be submitted to admin, rejected with reason, resubmitted, and approved; approve sets `isOfficial` without re-payout.  
3. During `running`, referee can Flag a horse into a draft incident with one click.  
4. After `finished`, referee can confirm results and resolve incidents with a stored verdict (including fine amount as data only).  
5. Admin review uses full report GET — UI derives counts from arrays.

---

## 12. Implementation notes

- Prefer extending existing models over new collections.
- Do not break betting cutoff / cron auto-start contracts tied to `race.status`.
- Update `CLAUDE.md` Section 4 (roles/status) and UC-R notes **after** slices land, in a docs pass owned by the team.
- **No automated git commits** by the agent unless the user explicitly asks.

---

**LAST UPDATED:** 2026-08-01  
**MAINTAINED FOR:** Group G07 — SE1823 Referee steward flow
