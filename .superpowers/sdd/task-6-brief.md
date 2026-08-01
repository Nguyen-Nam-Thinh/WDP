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


