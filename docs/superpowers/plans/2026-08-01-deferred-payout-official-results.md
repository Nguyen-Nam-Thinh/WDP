# Deferred Payout + Official Results — Implementation Plan

> **For agent:** leave uncommitted unless the user explicitly asks to commit.  
> **Spec:** `docs/superpowers/specs/2026-08-01-deferred-payout-official-results-design.md`  
> **Branch:** `feat/pre-race-stewards-report` (or current steward branch)

**Goal:** Race `finished` only writes provisional results; Admin approve pays purse + settles bets + marks Official; DQ re-ranks immediately; Fine creates a payable PenaltyTicket.

**Architecture:** Split `finalizeRace` into provisional write vs `settleOfficialPayouts` on approve. Extend `resolveIncident` for DQ rebuild + Fine tickets. Keep `race.status` enum unchanged; use `isOfficial` + `payoutSettledAt`.

**Tech Stack:** Node/Express/Mongoose, existing wallet + bet settle helpers, React referee/admin/spectator UIs.

## Global Constraints

- Do **not** change `race.status` values (`open|closed|pre_check|running|finished|cancelled`).
- Do **not** auto-debit fine; ticket only.
- Approve must be **idempotent** (`payoutSettledAt`).
- No automated git commits unless user asks.
- Prefer extending existing services over new microservice.

## File map

| Area | Files |
|------|--------|
| Models | `backend/src/models/race.model.js`, `race_result.model.js`, `referee_report.model.js`, **new** `penalty_ticket.model.js`, `transaction.model.js` |
| Simulation | `backend/src/services/race-simulation.service.js` |
| Settle helper | **new** `backend/src/services/race-payout.service.js` (or functions in simulation + called from referee) |
| Referee | `backend/src/services/referee.service.js`, `referee.routes.js`, `registration.service.js` (`maybeMarkStewardsReady`) |
| Penalties | **new** `penalty.service.js`, `penalty.controller.js`, `penalty.routes.js` + wire in `server`/`app` |
| FE | `ResultsConfirmPanel.tsx`, `RefereeDashboard.tsx` resolve dialog, spectator/results badges, **new** penalties UI (owner/jockey wallet area) |
| Admin | approve copy in `RefereeReportReview.tsx` |
| Docs | `docs/HUONG_DAN_VONG_DOI_TOURNAMENT_RACE.md` |

---

### Task P1: Provisional finalize (no money on finish)

**Files:**
- Modify: `backend/src/models/race.model.js` — add `payoutSettledAt: { type: Date, default: null }`
- Modify: `backend/src/models/race_result.model.js` — add `provisionalPosition: Number`, `disqualified: { type: Boolean, default: false }`; allow `position` to be `null` when DQ’d **or** keep position and filter by `disqualified` (prefer: keep `position` required for non-DQ; DQ set `disqualified: true` and move `position` to a high unused value **or** make position not unique — **use:** `disqualified` boolean + renumber others; DQ row `position: null` with `required: false` when disqualified)
- Modify: `backend/src/services/race-simulation.service.js` — `finalizeRace`
- Modify: notifications in same file — provisional copy

**Interfaces:**
- Produces: `finalizeRace` writes results with `prizeAmount=0`, `pointsEarned=0`, `provisionalPosition=position`, no wallet/bet/horse career updates; sets `status: finished` only.

- [ ] **Step 1:** Add `payoutSettledAt` on Race; add `provisionalPosition`, `disqualified` on RaceResult; set `position: { type: Number, min: 1, default: null, required: false }` (validate in service: non-DQ must have position).

- [ ] **Step 2:** Rewrite `finalizeRace` loop body to:
  1. `RaceResult.create` with position, finishTime, provisionalPosition, prizeAmount 0, pointsEarned 0, disqualified false  
  2. Build `positionMap` for socket only  
  3. Remove `walletService.creditWallet`, horse `$inc`, `settleBetsWithSession`  
  4. Keep `completeInvitationsForRace` if it does not credit purse (verify; if it pays jockey from purse, defer that to P4)  
  5. `Race.status = finished`

- [ ] **Step 3:** Change `sendRaceFinishedNotifications` to always use type `race_finished` and message “…kết quả tạm thời, chờ steward/admin duyệt” (no prize amounts).

- [ ] **Step 4:** Emit socket results with `provisional: true` (add field on payload if clients ignore unknown fields safely).

- [ ] **Step 5:** Manual verify: force-simulate a race → Mongo shows results with 0 prize; wallets unchanged; bets still pending.

- [ ] **Step 6:** FE badge — `ResultsConfirmPanel` + any spectator finished view: if `!race.isOfficial` show Chip “Kết quả tạm thời”.

---

### Task P2: DQ re-rank on resolve

**Files:**
- Modify: `backend/src/services/referee.service.js` — `resolveIncident`
- Create helper: `backend/src/services/race-result-order.helper.js` — `rebuildOfficialOrder(raceId, session?)`
- Modify: Zod `resolveIncidentSchema` if needed (no new fields for DQ)
- Modify: FE resolve + results table to show DQ / new positions

**Interfaces:**
- Consumes: RaceResults with `provisionalPosition`
- Produces: `rebuildOfficialOrder(raceId)` sets `disqualified` from incidents OR from result flags; renumbers non-DQ to 1..k by ascending `provisionalPosition`

- [ ] **Step 1:** Implement `rebuildOfficialOrder(raceId, session)`:
  ```js
  // 1. Load all RaceResults for race
  // 2. nonDq = results.filter(r => !r.disqualified).sort((a,b) => a.provisionalPosition - b.provisionalPosition)
  // 3. Assign position = index+1 for nonDq; save
  // 4. For disqualified: position = null; save
  ```

- [ ] **Step 2:** In `resolveIncident`, when `verdict === 'disqualified'`:
  1. Require `incident.registrationId` or `horseId` → find RaceResult  
  2. Set `RaceResult.disqualified = true`  
  3. Call `rebuildOfficialOrder(report.raceId)`  
  4. Save incident resolution as today  

- [ ] **Step 3:** If undoing is out of scope, document: cannot clear DQ once resolved in phase 1 (or only while report editable: allow re-resolve to non-DQ that clears flag + rebuild — optional YAGNI: skip undo).

- [ ] **Step 4:** FE `ResultsConfirmPanel`: show `DQ` badge; sort by position nulls last.

- [ ] **Step 5:** Verify: finish → resolve DQ on 1st → former 2nd becomes position 1 in DB; still prizeAmount 0.

---

### Task P3: PenaltyTicket + pay

**Files:**
- Create: `backend/src/models/penalty_ticket.model.js`
- Modify: `backend/src/models/transaction.model.js` — add `'penalty_payment'` to enum
- Modify: `backend/src/models/referee_report.model.js` — resolution add `fineTargetRole`, `fineTargetUserId`
- Create: `backend/src/services/penalty.service.js`
- Create: `backend/src/controllers/penalty.controller.js`
- Create: `backend/src/routes/penalty.routes.js`
- Wire route in app entry (find `app.use` pattern in `backend/src/server.js` or `app.js`)
- Modify: `resolveIncident` + Zod schema
- FE: resolve dialog target select; owner/jockey penalties list + pay

**Interfaces:**
- `createFineTicket({ userId, raceId, reportId, incidentId, registrationId, horseId, amount, note, createdBy }, session)`
- `listMyPenalties(userId)`
- `payPenalty(ticketId, userId)` → debit wallet, type `penalty_payment`

- [ ] **Step 1:** Model PenaltyTicket per spec §4.4; unique index on `incidentId`.

- [ ] **Step 2:** Extend resolve Zod:
  ```js
  fineTargetRole: z.enum(['owner', 'jockey']).optional()
  // superRefine: if verdict==='fine' require fineAmount>0 AND fineTargetRole
  ```

- [ ] **Step 3:** In `resolveIncident` for fine:
  1. Load Registration by incident.registrationId (or horseId + raceId)  
  2. `fineTargetUserId = role === 'owner' ? reg.ownerId : reg.jockeyId` (400 if missing)  
  3. Save resolution fields including role + userId  
  4. `PenaltyTicket.create` status `open`  
  5. `createNotification` to debtor  

- [ ] **Step 4:** `POST /penalties/:id/pay` + `GET /penalties/me` authenticated.

- [ ] **Step 5:** FE resolve dialog: when verdict Fine → Select Owner/Jockey (show names from registration if available).

- [ ] **Step 6:** Minimal FE: on Owner + Jockey wallet/overview, fetch `/penalties/me`, button “Nộp phạt”.

- [ ] **Step 7:** Verify: resolve fine → ticket open; pay → balance down; ticket paid; second pay 400.

---

### Task P4: Approve → economic finalize

**Files:**
- Create: `backend/src/services/race-payout.service.js` — `settleOfficialPayouts(raceId, session)`
- Modify: `approveReport` in `referee.service.js`
- Move/reuse logic currently removed from `finalizeRace` (purse, points, grade, settleBets)
- Admin FE copy

**Interfaces:**
- `settleOfficialPayouts(raceId)`:
  1. Load Race; if `payoutSettledAt` return early  
  2. Load RaceResults where `disqualified !== true`, sort by `position`  
  3. For each: compute prize/points; update RaceResult fields; credit owner; horse `$inc` + grade  
  4. `positionMap` from horseId → position; `settleBetsWithSession`  
  5. Set `payoutSettledAt`, `isOfficial: true`  

- [ ] **Step 1:** Implement `settleOfficialPayouts` by lifting code from old `finalizeRace` money block (use current positions, skip `disqualified`).

- [ ] **Step 2:** Bet settle: DQ’d horses must not appear as winners in `positionMap` (omit them).

- [ ] **Step 3:** `approveReport`: after setting report approved, start session → `settleOfficialPayouts(raceId)` → commit. If settle fails, abort and do not leave report approved inconsistently (prefer single session updating report + race + money).

- [ ] **Step 4:** Idempotent: second approve already blocked by status `approved`; also guard `payoutSettledAt`.

- [ ] **Step 5:** Admin UI: confirm text “Duyệt sẽ phát purse và settle cược theo thứ hạng hiện tại (sau DQ).”

- [ ] **Step 6:** Verify: provisional finish → DQ → approve → wallets credited once; bets settled; `isOfficial` true; Chip Official on FE.

---

### Task P5: Auto Pre-race Report on stewardsReady + CTA

**Files:**
- Modify: `backend/src/services/registration.service.js` — `maybeMarkStewardsReady`
- Reuse: `ensureDraftReport` / create draft in helper
- Modify: `RefereeDashboard.tsx` pre-check completion UX
- Update: `docs/HUONG_DAN_VONG_DOI_TOURNAMENT_RACE.md` timeline for deferred payout

**Interfaces:**
- When setting `stewardsReady: true`, call create-or-get draft `RefereeReport` for `race.refereeId`.

- [ ] **Step 1:** In `maybeMarkStewardsReady`, after update stewardsReady true, if refereeId present → `RefereeReport.findOneAndUpdate` upsert draft (or call shared `ensureDraftReportForRace(raceId)` extracted from referee.service to avoid circular require — put create in `referee-prerace.helper.js`).

- [ ] **Step 2:** FE after last horse checked: toast “Đã tạo/mở Pre-race Report” + button navigate `/referee/reports` and/or `openEditReport`.

- [ ] **Step 3:** Update hướng dẫn doc: money on Admin approve; Late Scratchings section unchanged; provisional vs official.

- [ ] **Step 4:** End-to-end checklist from spec §11.

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Provisional finalize | P1 |
| Provisional UI badge | P1 |
| DQ immediate re-rank | P2 |
| Fine → ticket + choose owner/jockey | P3 |
| Pay ticket | P3 |
| Approve settles money | P4 |
| Idempotent payout | P4 |
| Auto draft on stewardsReady | P5 |
| Late Scratchings unchanged | (existing; documented P5) |
| No status enum change | Global |

## Placeholder scan

No TBD steps; commit steps omitted by project policy (human commits).

---

## Execution handoff

Plan saved: `docs/superpowers/plans/2026-08-01-deferred-payout-official-results.md`

**Cách chạy:**

1. **Theo từng task** (P1 → P5) trong session này — khuyến nghị  
2. **Subagent-driven** từng task + review  

Trả lời **làm P1** (hoặc **làm hết P1–P5**) để bắt đầu code.
