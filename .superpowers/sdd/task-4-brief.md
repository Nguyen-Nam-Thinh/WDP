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


