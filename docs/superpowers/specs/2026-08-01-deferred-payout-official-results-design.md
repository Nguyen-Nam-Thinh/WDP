# Deferred Payout + Official Results (Approach 1) — Design Spec

> **Date:** 2026-08-01  
> **Project:** HRTMS-AI (G07)  
> **Status:** Design approved by user (Approach 1 + Hybrid DQ/Fine)  
> **Supersedes:** `2026-08-01-referee-steward-flow-design.md` §5.4 Payout and §7.2 “documentary only” for `disqualified` / fine wallet behavior  
> **Commit policy:** Implementation stays uncommitted until the human author commits.

---

## 1. Problem

Current engine on race `finished`:

1. Writes `race_results`  
2. Credits **purse** to owners  
3. Updates horse **points / earnings / grade**  
4. **Settles bets**  

Admin approving the referee report only sets `isOfficial` — money and rankings already moved.

Desired steward reality:

- Pre-check done → **Pre-race Report** exists (auto draft; Late Scratchings auto-filled on Fail).  
- After simulation → results are **provisional**.  
- Referee resolves flags (DQ re-ranks; Fine creates **debt ticket**).  
- **Admin approve** → then purse + bet settle + official BXH.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Architecture | **Approach 1 — Split finalize** |
| Race `status` enum | **Unchanged** (`… → running → finished`) |
| When money moves | **Only on Admin approve** of referee report (`isOfficial` transition) |
| Provisional results | On `finished`: write finish order/times; **no** purse credit; **no** bet settle; **no** career points/earnings/winCount/grade upgrade |
| DQ on Resolve | **Immediate re-rank** on `race_results` (horse out of money positions; others compress) |
| Fine on Resolve | Create **PenaltyTicket** (`open`); debtor = **Owner or Jockey** chosen by referee; **no** auto wallet debit |
| Paying fine | Debtor pays via wallet action → ticket `paid` |
| Approve vs tickets | Phase 1: approve **does not require** all tickets `paid` |
| Warning / none verdicts | Documentary only (no order/money change) |
| Public BXH / “official” race results UI | Show **Provisional** when `finished && !isOfficial`; **Official** when `isOfficial` |
| Pre-race Report after pre-check | When `stewardsReady` becomes true → `ensureDraftReport` (idempotent) |
| Late Scratchings | Unchanged: auto on Fail → `preRaceReport.lateScratchings` |
| Git | Implementer does **not** auto-commit |

---

## 3. End-to-end timeline

```
Admin: Tournament + Race + assign Referee
Owner: register horses
Race → closed → pre_check
Referee: Pass / Fail(+category)
  Fail → Late Scratching + DQ reg + refunds (existing)
  All checked → stewardsReady = true → auto draft RefereeReport
Referee: edit Pre-race Report (Track, Rider/Gear/Vet) anytime while editable
Race → running → Live Flag (draft incidents)
Race → finished → provisional RaceResult only (prize/points = 0)
Referee: Confirm results (resultsConfirmedAt)
Referee: Resolve drafts
  DQ → re-rank RaceResult immediately
  Fine → PenaltyTicket(open) for chosen Owner|Jockey
  warning/none → status resolved only
Referee: Submit report → pending_approval
Admin: Approve → payout purse + points/grade + settle bets + isOfficial=true
        Reject → referee edits / re-resolves if still editable rules allow
```

---

## 4. Data model

### 4.1 Race (existing + flags)

Unchanged fields used:

- `status`, `stewardsReady`, `isOfficial`, `resultsConfirmedAt`, `resultsConfirmedBy`

Optional clarity flag (recommended):

```js
payoutSettledAt: Date | null  // set when approve runs economic finalize; idempotency
```

### 4.2 RaceResult

Keep schema; semantics change:

| Phase | `position` | `prizeAmount` | `pointsEarned` |
|-------|------------|---------------|----------------|
| Provisional (`finished`, not official) | finish order (1..n) | `0` | `0` |
| After DQ resolve | recomputed; DQ’d horse: see §5 | still `0` until approve | still `0` |
| After approve | official order | filled from `PRIZE_RATIO` | filled from `POINTS_BY_GRADE` |

**DQ representation (pick one; recommended A):**

- **A (recommended):** `disqualified: Boolean` on `RaceResult` + `position` set to `null` or sentinel high value **excluded** from prize/bet ranking; remaining horses renumbered `1..k`.  
- **B:** Delete DQ row and renumber — loses audit of finishTime.

Also store:

```js
provisionalPosition: Number  // original simulation order (immutable after finalize)
```

So DQ can recompute from provisional + set of DQ’d registrationIds.

### 4.3 Incident.resolution (extend)

```js
resolution: {
  verdict: 'none' | 'warning' | 'fine' | 'disqualified',
  fineAmount: Number | null,
  fineTargetRole: 'owner' | 'jockey' | null,  // required if fine
  fineTargetUserId: ObjectId | null,         // resolved at resolve-time
  note: String,
  resolvedAt: Date,
}
```

### 4.4 PenaltyTicket (new collection)

```js
{
  _id,
  userId,           // debtor (owner or jockey)
  raceId,
  reportId,
  incidentId,
  registrationId,
  horseId,
  amount,           // > 0
  status: 'open' | 'paid' | 'waived',
  note,
  createdBy,        // referee
  paidAt: null,
  createdAt, updatedAt
}
```

Indexes: `{ userId: 1, status: 1 }`, `{ raceId: 1 }`, `{ incidentId: 1 }` unique (one ticket per resolved fine incident).

### 4.5 Bets

Unchanged until approve. Remain `pending` (or current pre-settle status) while `finished && !isOfficial`.  
Settle uses **official** position map after DQ compression.

---

## 5. Behavior detail

### 5.1 Split `finalizeRace` (simulation)

**On finish (provisional write):**

1. Create `RaceResult` per starter: `position`, `finishTime`, `provisionalPosition = position`, `prizeAmount = 0`, `pointsEarned = 0`, `disqualified = false`.  
2. **Do not** credit wallets.  
3. **Do not** `$inc` horse points/earnings/wins/grade.  
4. **Do not** call `settleBetsWithSession`.  
5. Still: `completeInvitationsForRace` (or defer if it assumes prizes — verify; prefer keep invitation complete without money).  
6. Set `race.status = finished`.  
7. Socket `race:finished` may emit provisional results; clients should label Provisional if `!isOfficial`.

**Notifications:** Prefer “Race finished — kết quả tạm thời, chờ steward/admin” instead of prize_received amounts > 0.

### 5.2 Resolve `disqualified`

Preconditions: report editable (`draft` \| `rejected`); race `finished`; incident exists.

1. Mark incident resolved with verdict `disqualified`.  
2. Set matching `RaceResult.disqualified = true`.  
3. Rebuild positions for non-DQ results ordered by `provisionalPosition` (or finishTime): assign `1..k`.  
4. DQ’d rows: keep `finishTime` / `provisionalPosition`; `position` null or excluded from prize sort.  
5. **No** wallet / bet changes yet.

Idempotent: resolving again / second DQ re-runs rebuild from all DQ flags.

### 5.3 Resolve `fine`

1. Require `fineAmount > 0` and `fineTargetRole` in `owner|jockey`.  
2. Resolve target user from registration (`ownerId` or `jockeyId`); 400 if jockey missing.  
3. Create `PenaltyTicket` `open`.  
4. Notify debtor.  
5. No wallet debit.

### 5.4 Pay ticket

`POST /penalties/:id/pay` (auth = ticket.userId):

- Atomic: debit wallet, transaction type e.g. `penalty_payment`, ticket → `paid`.  
- Insufficient balance → 400.

### 5.5 Admin approve = economic finalize

`approveReport` (extend existing):

1. Existing: report → `approved`, `isOfficial = true`, review fields.  
2. If `race.payoutSettledAt` already set → skip money (idempotent).  
3. Else in one Mongo session:  
   - For each non-DQ `RaceResult` by official `position`: set `prizeAmount`, `pointsEarned`; credit owner purse; `$inc` horse stats; grade upgrade.  
   - `settleBetsWithSession` with official position map (**exclude** DQ’d horses from win/place/show eligibility as non-finishers / not in top N).  
   - Set `payoutSettledAt = now`.  
4. Notify owners/spectators of official settlement.

**Reject:** no payout. If already paid — must not happen (approve only once).

### 5.6 Auto Pre-race Report on `stewardsReady`

In `maybeMarkStewardsReady`, when flipping `stewardsReady` to true:

- Call same logic as `ensureDraftReport` (create draft if missing).  
- FE: after last Pass/Fail, toast + optional navigate to edit report / highlight Reports tab.

### 5.7 Rankings / results APIs

- Career rankings (horse totalPoints): only increase **after approve** → natural.  
- Per-race results endpoints: return `race.isOfficial` + `provisional: !isOfficial`; UI badges.  
- Optional: hide purse amounts until official (show “Pending steward approval”).

---

## 6. API surface (delta)

| Method | Path | Notes |
|--------|------|-------|
| existing | `PATCH .../incidents/:id/resolve` | Add `fineTargetRole`; DQ triggers re-rank |
| existing | `POST .../admin/reports/:id/approve` | Triggers economic finalize |
| new | `GET /penalties/me` | Debtor list |
| new | `POST /penalties/:id/pay` | Pay ticket |
| existing | pre-check / ensure report | Auto-ensure on stewardsReady |

---

## 7. UI delta

| Role | Change |
|------|--------|
| Referee | After pre-check complete → CTA “Mở Pre-race Report”; Resolve form: target Owner/Jockey when Fine; Results table shows DQ + compressed order |
| Owner / Jockey | Wallet/Penalties: open tickets + Pay |
| Spectator | Finished race: “Kết quả tạm thời” until Official; bets show “Chờ chốt” |
| Admin | Approve copy: “Duyệt sẽ phát purse + settle cược theo thứ hạng hiện tại (sau DQ)” |

---

## 8. Late Scratchings (unchanged usage)

1. Pre-check **Không Đạt** + Category (+ Note).  
2. Backend appends Late Scratching line; creates draft report if needed.  
3. Horse does **not** race.  
4. Visible in Pre-race Report §2 / PDF / admin review.  
5. Not used for post-race DQ (post-race uses incident resolution).

---

## 9. Migration / backward compatibility

Races already `finished` with money paid before this change:

- Leave as-is; set `payoutSettledAt = createdAt` of results or `isOfficial` heuristic in a one-off script optional.  
- New code path only for races finalized after deploy (or `payoutSettledAt == null && prizeAmounts all 0`).

Detect provisional finish: all `prizeAmount === 0` and `!payoutSettledAt`.

---

## 10. Out of scope

- Requiring tickets paid before approve  
- Admin waive UI (model supports `waived`; UI later)  
- Photofinish media  
- Changing `race.status` to Official  
- Auto collision flags  
- Re-settling bets if admin somehow re-opens (approve is terminal)

---

## 11. Success criteria

1. Finish race → wallets unchanged; bets unsettled; results visible as Provisional.  
2. DQ resolve → order updates immediately; still no payout.  
3. Fine resolve → ticket `open` for chosen user; pay works via wallet.  
4. Admin approve once → purse + points + bet settle + `isOfficial`; second approve no double pay.  
5. Pre-check complete → draft Pre-race Report exists without waiting for race end.  
6. Late Scratchings still auto-fill on Fail.

---

## 12. Implementation slices (suggested)

| Slice | Scope |
|-------|--------|
| **P1** | Split `finalizeRace` (provisional only) + FE Provisional badges |
| **P2** | DQ re-rank on resolve + `provisionalPosition` / `disqualified` |
| **P3** | PenaltyTicket + pay API + FE |
| **P4** | Approve → economic finalize + idempotency |
| **P5** | Auto draft report on `stewardsReady` + referee CTA |

---

## 13. Spec self-review

- [x] No “TBD” placeholders for locked rules  
- [x] Supersedes prior “settle on finished” and “DQ documentary only”  
- [x] Race status enum preserved  
- [x] Fine = debt ticket, not auto-debit; debtor selectable  
- [x] Scope bounded (5 slices)  

---

**LAST UPDATED:** 2026-08-01  
**MAINTAINED FOR:** Group G07 — SE1823
