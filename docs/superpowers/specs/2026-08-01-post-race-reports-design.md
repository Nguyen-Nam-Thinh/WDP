# Post-race Reports (Approach A) — Design Spec

> **Date:** 2026-08-01  
> **Project:** HRTMS-AI (G07)  
> **Status:** Design approved (Approach A)  
> **Extends:** `2026-08-01-referee-steward-flow-design.md`, `2026-08-01-deferred-payout-official-results-design.md`  
> **Commit policy:** Implementation stays uncommitted until the human author commits.

---

## 1. Problem

After `finished`, referee can Confirm results and Resolve Flag incidents (`fine` / `DQ` / `warning`), but the Stewards' Report lacks structured **post-race** content:

- Inquiries (statements, camera angles, fault conclusion)
- Performance explanations (favorite / poor run)
- Post-race vet orders (blood / urine / endoscopy / clinical) — order only, no lab
- Extended penalties (reason codes + jockey suspension)

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Architecture | **A** — extend `incidents` + embed `postRaceReport` on same `RefereeReport` |
| Inquiries | Fields on incident; Resolve remains the verdict step |
| Performance / Vet | Arrays in `postRaceReport` — documentary only |
| Penalties | Keep verdicts; add `reasonCode` + `suspensionDays` |
| Suspension effect | `suspensionDays > 0` → `jockeyProfile.suspendedUntil = max(existing, now + days)`; block invitation accept + assign/register with that jockey |
| Submit gate | All incidents must be `resolved`; `trackCondition` still required |
| Payout / Official | Unchanged — Admin approve settles |
| Out of scope | Real doping lab, video upload, auto-favorite detect, undo suspension after approve |

---

## 3. Timeline (after finished)

1. Confirm results  
2. Fill Inquiry on flagged / draft incidents  
3. Resolve (verdict + reason + optional suspension)  
4. Edit `postRaceReport` (performance + vet orders)  
5. Submit → `pending_approval`  
6. Admin approve → Official + payout  

---

## 4. Data model

### 4.1 Incident inquiry + resolution extras

```js
inquiry: {
  statements: [{ role: 'jockey'|'owner'|'witness', name: String, text: String }],
  cameraAngles: [String],
  faultParty: 'subject'|'other'|'both'|'none'|null,
  conclusion: String,
},
resolution: {
  // existing verdict / fine* / note / resolvedAt
  reasonCode: 'interference'|'whip'|'careless'|'late'|'other'|null,
  suspensionDays: Number|null,
}
```

### 4.2 `postRaceReport`

```js
postRaceReport: {
  performanceExplanations: [{
    registrationId, horseId, label,
    summonedRoles: ['jockey'|'owner'],
    explanation: String,
    recordedAt: Date,
  }],
  vetOrders: [{
    registrationId, horseId, label,
    orderType: 'blood'|'urine'|'endoscopy'|'clinical',
    note: String,
    orderedAt: Date,
  }],
}
```

### 4.3 User.jockeyProfile

```js
suspendedUntil: Date | null
```

---

## 5. API

| Endpoint | Behavior |
|----------|----------|
| `PATCH /referee/reports/:id/incidents/:incidentId` | Save inquiry (+ optional type/description/action) while report editable |
| `PATCH .../incidents/:id/resolve` | Accept inquiry finalize, `reasonCode`, `suspensionDays`; apply fine/DQ + suspension |
| `PATCH /referee/reports/:id` | Accept `postRaceReport.performanceExplanations` + `vetOrders` (replace arrays) |
| `POST .../submit` | 400 if any incident `status === 'draft'` |
| PDF | Print Inquiry / Performance / Vet Orders / Penalties; empty → `Nil` |

---

## 6. Suspension guards

- `acceptInvitation`: if `jockeyProfile.suspendedUntil > now` → 400  
- `registerHorse` / `assignJockey` when `jockeyId` set: same check  

---

## 7. UI

- Report editor: Post-race section (performance + vet)  
- Resolve dialog: Inquiry fields + reasonCode + suspensionDays  
- Submit blocked with message if drafts remain  
- Admin/PDF: show new blocks  
- Jockey overview: banner if suspended  

---

## 8. Acceptance

1. Flag → fill inquiry → resolve with whip + 3 days → jockey cannot accept invitation until date.  
2. Add performance explanation + vet order → appear on PDF as structured lines.  
3. Submit with unresolved draft → 400.  
4. Fine/DQ + Admin approve still settle as deferred-payout spec.  

---

**MAINTAINED FOR:** Group G07 — SE1823 Post-race stewards report
