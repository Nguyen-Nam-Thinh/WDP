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


