# Kiểm Tra Trước Đua (Pre-check) + Báo Cáo Chính Thức (Referee Report)

> File tổng hợp nghiệp vụ + toàn bộ code liên quan để copy.
> Nguồn: codebase HRTMS-AI — Group G07

---

## A. NGHIỆP VỤ

### A1. Hai chức năng liên quan

| Chức năng | UC | Route FE | Mô tả |
|-----------|-----|----------|-------|
| Kiểm Tra Trước Đua (Pre-check) | UC-R3 | `/referee/pre-check` | Referee kiểm tra từng ngựa trước khi race chạy |
| Báo Cáo Chính Thức | UC-R5, UC-R7, UC-R8 | `/referee/reports` | Biên bản referee, ghi sự cố, nộp, export PDF |

### A2. Race status flow liên quan pre-check

```
open → closed → pre_check → running → finished
                      ↓
                 cancelled (admin / <2 ngựa passed)
```

| Transition | Ai làm | Điều kiện |
|------------|--------|-----------|
| `open` → `closed` | Cron (qua cutoffTime) hoặc admin | — |
| `closed` → `pre_check` | Admin | Có `refereeId` + ≥ 2 registration `active` |
| Trong `pre_check` | Referee được assign | Kiểm từng ngựa: `passed` / `failed` |
| `pre_check` → `running` | Cron mỗi 30s khi `scheduledTime` đến | — |
| Simulation | System | Chỉ ngựa `status=active` AND `preCheckResult.status=passed` |
| `< 2` ngựa passed | System | Race → `cancelled` + hoàn bet |

### A3. Pre-check result

| Status | Ý nghĩa | Side effect |
|--------|---------|-------------|
| `pending` | Chưa kiểm | — |
| `passed` | Đạt | Được vào simulation |
| `failed` | Không đạt | `registration.status = disqualified`, hoàn **70%** phí ĐK cho owner (`REFUND_RATES.disqualifyOwner`) |

**Quy tắc:**
- Chỉ referee được phân công (`race.refereeId`) mới kiểm được
- Race phải đang `pre_check`
- Registration phải `active`
- Checklist 4 nhóm trên FE (giấy tờ, sức khỏe, doping, thiết bị) — **không lưu DB**, chỉ gửi `status` + `note`
- Spec CLAUDE.md: DQ pre-race hoàn 100% bet spectator — **code hiện tại chưa implement** phần hoàn bet theo ngựa bị loại

### A4. Checklist UI (FE only)

1. **Tư Cách & Giấy Tờ**: passport, vaccination, grade_eligible, ownership
2. **Kiểm Tra Sức Khỏe**: no_lameness, vital_signs, coat_condition, eyes_clear, breathing
3. **Kiểm Tra Doping**: sample_collected, no_prohibited, vet_clearance
4. **Thiết Bị & Kỵ Sĩ**: saddle_weight, bit_check, jockey_license, jockey_weight, silks

### A5. Báo cáo chính thức

| Thao tác | API | Rule |
|----------|-----|------|
| Tạo | `POST /referee/reports` `{ raceId }` | 1 race = 1 report; chỉ referee assign |
| List | `GET /referee/reports` | Của chính referee |
| Chi tiết | `GET /referee/reports/:id` | referee hoặc admin |
| Sửa | `PATCH /referee/reports/:id` | `preCheckSummary`, `overallNotes`; không sửa khi `submitted` |
| Thêm sự cố | `POST /referee/reports/:id/incidents` | type: interference/doping/equipment_violation/jockey_violation/other |
| Xóa sự cố | `DELETE /referee/reports/:id/incidents/:incidentId` | Chỉ khi draft |
| Nộp | `POST /referee/reports/:id/submit` | draft → submitted (khóa) |
| PDF | `GET /referee/reports/:id/pdf` | referee hoặc admin |

### A6. API Pre-check

```
PATCH /registrations/:id/pre-check
Auth: referee
Body: { status: "passed" | "failed", note?: string (max 500) }
```

### A7. File map

| File | Vai trò |
|------|---------|
| `backend/src/models/registration.model.js` | Schema preCheckResult |
| `backend/src/services/registration.service.js` | `updatePreCheck` |
| `backend/src/controllers/registration.controller.js` | Controller |
| `backend/src/routes/registration.routes.js` | Route + Zod |
| `backend/src/services/race.service.js` | Transition → pre_check, forceSimulate |
| `backend/src/jobs/raceStatus.job.js` | Cron auto-start |
| `backend/src/services/race-simulation.service.js` | Filter ngựa passed |
| `backend/src/models/referee_report.model.js` | Schema report |
| `backend/src/services/referee.service.js` | CRUD report + PDF |
| `backend/src/controllers/referee.controller.js` | Controller |
| `backend/src/routes/referee.routes.js` | Routes |
| `frontend/src/app/api/registration.ts` | FE API pre-check |
| `frontend/src/app/api/referee.ts` | FE API report |
| `frontend/src/app/pages/RefereeDashboard.tsx` | UI pre-check + reports |

---

## B. CODE — BACKEND

---

### B1. `backend/src/models/registration.model.js`

```js
const mongoose = require('mongoose');

const preCheckResultSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
    note: { type: String, default: '' },
    checkedAt: { type: Date, default: null },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
    horseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Horse', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    feePaid: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'cancelled', 'disqualified'], default: 'active' },
    preCheckResult: { type: preCheckResultSchema, default: () => ({}) },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
    refundAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

registrationSchema.index({ raceId: 1, horseId: 1 }, { unique: true });
registrationSchema.index({ ownerId: 1 });
registrationSchema.index({ raceId: 1, status: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = { Registration };
```

---

### B2. `updatePreCheck` — `backend/src/services/registration.service.js`

```js
async function updatePreCheck(registrationId, refereeId, { status, note }) {
  const reg = await Registration.findById(registrationId).populate('raceId');
  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');

  const race = reg.raceId;
  if (race.status !== 'pre_check') throw new AppError(400, 'Cuộc đua phải ở trạng thái kiểm tra trước đua');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Chỉ trọng tài được phân công mới có thể thực hiện kiểm tra');
  }
  if (reg.status !== 'active') throw new AppError(400, `Đăng ký đã ở trạng thái ${reg.status}`);

  reg.preCheckResult = { status, note: note || '', checkedAt: new Date() };

  if (status === 'failed') {
    const refundAmount = Math.floor(reg.feePaid * REFUND_RATES.disqualifyOwner);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (refundAmount > 0) {
        const wallet = await Wallet.findOne({ userId: reg.ownerId }).session(session);
        if (!wallet) throw new AppError(404, 'Không tìm thấy ví');
        await walletService.creditWallet(
          wallet._id, reg.ownerId, refundAmount,
          'registration_refund',
          `Hoàn tiền (70%): ngựa bị loại kiểm tra trước đua ${race.name}`,
          reg._id, 'Registration', session,
        );
      }

      reg.status = 'disqualified';
      reg.refundAmount = refundAmount;
      await reg.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    await reg.save();
  }

  return Registration.findById(registrationId)
    .populate('raceId', 'name grade scheduledTime status')
    .populate('horseId', 'name breed gender currentGrade')
    .populate('ownerId', 'fullName email');
}
```

---

### B3. `backend/src/controllers/registration.controller.js`

```js
const registrationService = require('../services/registration.service');
const { sendSuccess } = require('../utils/response');

async function registerHorse(req, res, next) {
  try {
    const registration = await registrationService.registerHorse(req.user._id, req.body);
    sendSuccess(res, registration, 201, 'Horse registered successfully');
  } catch (error) {
    next(error);
  }
}

async function getRegistrations(req, res, next) {
  try {
    const { page, limit, raceId, status } = req.query;
    const result = await registrationService.getRegistrations(req.user._id, req.user.role, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      raceId,
      status,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getRegistrationById(req, res, next) {
  try {
    const registration = await registrationService.getRegistrationById(
      req.params.id, req.user._id, req.user.role,
    );
    sendSuccess(res, registration);
  } catch (error) {
    next(error);
  }
}

async function assignJockey(req, res, next) {
  try {
    const registration = await registrationService.assignJockey(
      req.params.id, req.user._id, req.body.jockeyId,
    );
    sendSuccess(res, registration, 200, 'Jockey assigned successfully');
  } catch (error) {
    next(error);
  }
}

async function cancelRegistration(req, res, next) {
  try {
    const registration = await registrationService.cancelRegistration(req.params.id, req.user._id);
    sendSuccess(res, registration, 200, 'Registration cancelled with 40% refund');
  } catch (error) {
    next(error);
  }
}

async function updatePreCheck(req, res, next) {
  try {
    const registration = await registrationService.updatePreCheck(
      req.params.id, req.user._id, req.body,
    );
    sendSuccess(res, registration, 200, 'Pre-check result updated');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerHorse, getRegistrations, getRegistrationById,
  assignJockey, cancelRegistration, updatePreCheck,
};
```

---

### B4. `backend/src/routes/registration.routes.js`

```js
const { Router } = require('express');
const { z } = require('zod');
const registrationController = require('../controllers/registration.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const createRegistrationSchema = z.object({
  raceId: z.string().min(1),
  horseId: z.string().min(1),
  jockeyId: z.string().min(1).optional(),
});

const assignJockeySchema = z.object({
  jockeyId: z.string().min(1),
});

const preCheckSchema = z.object({
  status: z.enum(['passed', 'failed']),
  note: z.string().max(500).optional(),
});

router.use(authenticate);

router.post('/', authorize('owner'), validate(createRegistrationSchema), registrationController.registerHorse);
router.get('/', authorize('owner', 'admin'), registrationController.getRegistrations);
router.get('/:id', authorize('owner', 'admin', 'referee'), registrationController.getRegistrationById);
router.patch('/:id/assign-jockey', authorize('owner'), validate(assignJockeySchema), registrationController.assignJockey);
router.delete('/:id', authorize('owner'), registrationController.cancelRegistration);
router.patch('/:id/pre-check', authorize('referee'), validate(preCheckSchema), registrationController.updatePreCheck);

module.exports = router;
```

---

### B5. `backend/src/models/referee_report.model.js`

```js
const mongoose = require('mongoose');

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
    preCheckSummary: { type: String, trim: true, default: '' },
    overallNotes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

refereeReportSchema.index({ refereeId: 1 });

const RefereeReport = mongoose.model('RefereeReport', refereeReportSchema);

module.exports = { RefereeReport };
```

---

### B6. `backend/src/services/referee.service.js` (FULL)

```js
const PDFDocument = require('pdfkit');
const { RefereeReport } = require('../models/referee_report.model');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { AppError } = require('../middleware/error.middleware');

// ── UC-R2: Xem race được phân công ────────────────────────────────────────────

async function getAssignedRaces(refereeId, { page = 1, limit = 10, status } = {}) {
  const filter = { refereeId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [races, total] = await Promise.all([
    Race.find(filter)
      .populate('tournamentId', 'name status')
      .sort({ scheduledTime: 1 })
      .skip(skip)
      .limit(limit),
    Race.countDocuments(filter),
  ]);

  return { races, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── UC-R7: Tạo / lấy Referee Report ──────────────────────────────────────────

async function createReport(refereeId, raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Bạn không phải trọng tài được phân công cho cuộc đua này');
  }

  const existing = await RefereeReport.findOne({ raceId });
  if (existing) throw new AppError(409, 'Báo cáo cho cuộc đua này đã tồn tại');

  const report = await RefereeReport.create({ raceId, refereeId });
  return populateReport(report);
}

async function getMyReports(refereeId, { page = 1, limit = 10, status } = {}) {
  const filter = { refereeId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    RefereeReport.find(filter)
      .populate('raceId', 'name grade scheduledTime status tournamentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RefereeReport.countDocuments(filter),
  ]);

  return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getReportById(reportId, userId, role) {
  const report = await populateReport(await RefereeReport.findById(reportId));
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');

  const isReferee = report.refereeId._id.toString() === userId;
  if (!isReferee && role !== 'admin') throw new AppError(403, 'Bạn không có quyền truy cập');

  return report;
}

async function updateReport(reportId, refereeId, { preCheckSummary, overallNotes }) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Không thể chỉnh sửa báo cáo đã nộp');

  if (preCheckSummary !== undefined) report.preCheckSummary = preCheckSummary;
  if (overallNotes !== undefined) report.overallNotes = overallNotes;
  await report.save();

  return populateReport(report);
}

// ── UC-R5: Ghi nhận incidents ─────────────────────────────────────────────────

async function addIncident(reportId, refereeId, incidentData) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Không thể thêm sự cố vào báo cáo đã nộp');

  // Validate registrationId belongs to this race if provided
  if (incidentData.registrationId) {
    const reg = await Registration.findOne({ _id: incidentData.registrationId, raceId: report.raceId });
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký trong cuộc đua này');
    incidentData.horseId = reg.horseId;
  }

  report.incidents.push(incidentData);
  await report.save();

  return populateReport(report);
}

async function removeIncident(reportId, refereeId, incidentId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Không thể xóa sự cố khỏi báo cáo đã nộp');

  const before = report.incidents.length;
  report.incidents = report.incidents.filter((i) => i._id.toString() !== incidentId);
  if (report.incidents.length === before) throw new AppError(404, 'Không tìm thấy sự cố');

  await report.save();
  return populateReport(report);
}

// ── UC-R7: Submit report ──────────────────────────────────────────────────────

async function submitReport(reportId, refereeId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  if (report.status === 'submitted') throw new AppError(400, 'Báo cáo đã được nộp trước đó');

  report.status = 'submitted';
  report.submittedAt = new Date();
  await report.save();

  return populateReport(report);
}

// ── UC-R8: Export PDF ─────────────────────────────────────────────────────────

async function generateReportPdf(reportId, userId, role) {
  const report = await RefereeReport.findById(reportId)
    .populate('refereeId', 'fullName email refereeProfile')
    .populate('raceId')
    .populate({ path: 'raceId', populate: { path: 'tournamentId', select: 'name location' } })
    .populate('incidents.registrationId', 'horseId jockeyId')
    .populate('incidents.horseId', 'name breed');

  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');

  const isReferee = report.refereeId._id.toString() === userId;
  if (!isReferee && role !== 'admin') throw new AppError(403, 'Bạn không có quyền truy cập');

  // Fetch registrations for the race to list participating horses
  const registrations = await Registration.find({ raceId: report.raceId._id, status: { $in: ['active', 'disqualified'] } })
    .populate('horseId', 'name breed gender currentGrade')
    .populate('jockeyId', 'fullName')
    .populate('ownerId', 'fullName');

  const race = report.raceId;
  const tournament = race.tournamentId;
  const referee = report.refereeId;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primaryColor = '#1a1a2e';
    const accentColor = '#e94560';
    const mutedColor = '#666666';
    const lineColor = '#dddddd';

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('RACE REFEREE OFFICIAL REPORT', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text('Horse Racing Tournament Management System', 50, 52, { align: 'center' });
    doc.fillColor(accentColor).fontSize(10)
      .text(`Status: ${report.status.toUpperCase()}`, 50, 68, { align: 'center' });

    doc.moveDown(2.5);

    // ── Race Info ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('RACE INFORMATION');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);

    const infoRows = [
      ['Tournament', tournament?.name || 'N/A'],
      ['Race Name', race.name],
      ['Grade', race.grade],
      ['Distance', `${race.distance} m`],
      ['Purse', `${race.purse.toLocaleString('vi-VN')} coins`],
      ['Scheduled Time', new Date(race.scheduledTime).toLocaleString('en-GB')],
      ['Race Status', race.status.toUpperCase()],
      ['Location', tournament?.location || 'N/A'],
    ];

    doc.fontSize(10).font('Helvetica');
    infoRows.forEach(([label, value]) => {
      doc.fillColor(mutedColor).text(label + ':', 50, doc.y, { continued: true, width: 150 });
      doc.fillColor(primaryColor).text(' ' + value);
    });

    doc.moveDown(1);

    // ── Referee Info ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('REFEREE');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);

    doc.fontSize(10).font('Helvetica');
    doc.fillColor(mutedColor).text('Name:', 50, doc.y, { continued: true, width: 150 });
    doc.fillColor(primaryColor).text(' ' + referee.fullName);
    doc.fillColor(mutedColor).text('Email:', 50, doc.y, { continued: true, width: 150 });
    doc.fillColor(primaryColor).text(' ' + referee.email);
    if (referee.refereeProfile?.licenseNumber) {
      doc.fillColor(mutedColor).text('License:', 50, doc.y, { continued: true, width: 150 });
      doc.fillColor(primaryColor).text(' ' + referee.refereeProfile.licenseNumber);
    }

    doc.moveDown(1);

    // ── Participating Horses ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
      .text(`PARTICIPATING HORSES (${registrations.length})`);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);

    if (registrations.length === 0) {
      doc.fillColor(mutedColor).fontSize(10).text('No registrations found.');
    } else {
      const colWidths = [180, 80, 80, 80, 75];
      const headers = ['Horse', 'Grade', 'Jockey', 'Owner', 'Status'];
      const startX = 50;
      let y = doc.y;

      doc.rect(startX, y, doc.page.width - 100, 18).fill('#f0f0f0');
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
      let x = startX + 4;
      headers.forEach((h, i) => {
        doc.text(h, x, y + 4, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += 20;

      doc.fontSize(9).font('Helvetica');
      registrations.forEach((reg, idx) => {
        if (idx % 2 === 0) doc.rect(startX, y, doc.page.width - 100, 16).fill('#fafafa');
        x = startX + 4;
        const row = [
          reg.horseId?.name || '-',
          reg.horseId?.currentGrade || '-',
          reg.jockeyId?.fullName || 'Unassigned',
          reg.ownerId?.fullName || '-',
          reg.status,
        ];
        doc.fillColor(primaryColor);
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y + 2, { width: colWidths[i] });
          x += colWidths[i];
        });
        y += 17;
      });
      doc.y = y + 5;
    }

    doc.moveDown(1);

    // ── Pre-check Summary ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('PRE-CHECK SUMMARY');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(primaryColor)
      .text(report.preCheckSummary || '(No summary provided)', { width: doc.page.width - 100 });

    doc.moveDown(1);

    // ── Incidents ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
      .text(`INCIDENTS (${report.incidents.length})`);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);

    if (report.incidents.length === 0) {
      doc.fillColor(mutedColor).fontSize(10).text('No incidents recorded.');
    } else {
      report.incidents.forEach((incident, idx) => {
        doc.rect(50, doc.y, doc.page.width - 100, 14).fill('#fff3cd');
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
          .text(`#${idx + 1}  ${incident.type.replace(/_/g, ' ').toUpperCase()}`, 54, doc.y + 1);
        doc.moveDown(0.8);

        const horseName = incident.horseId?.name || 'N/A';
        doc.fontSize(9).font('Helvetica').fillColor(mutedColor)
          .text('Horse:', 54, doc.y, { continued: true, width: 80 });
        doc.fillColor(primaryColor).text(' ' + horseName, { continued: true });
        doc.fillColor(mutedColor).text('   Recorded:', { continued: true });
        doc.fillColor(primaryColor).text(' ' + new Date(incident.recordedAt).toLocaleString('en-GB'));

        doc.fillColor(mutedColor).text('Description:', 54, doc.y, { continued: true, width: 80 });
        doc.fillColor(primaryColor).text(' ' + incident.description, { width: doc.page.width - 140 });

        if (incident.action) {
          doc.fillColor(mutedColor).text('Action taken:', 54, doc.y, { continued: true, width: 80 });
          doc.fillColor(primaryColor).text(' ' + incident.action);
        }
        doc.moveDown(0.6);
      });
    }

    doc.moveDown(1);

    // ── Overall Notes ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('OVERALL NOTES');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(primaryColor)
      .text(report.overallNotes || '(No notes provided)', { width: doc.page.width - 100 });

    doc.moveDown(2);

    // ── Footer / Signature ──
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(lineColor).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fillColor(mutedColor).fontSize(9)
      .text(`Report ID: ${report._id}`, 50, doc.y, { continued: true })
      .text(`  |  Generated: ${new Date().toLocaleString('en-GB')}`, { continued: true })
      .text(`  |  Submitted: ${report.submittedAt ? new Date(report.submittedAt).toLocaleString('en-GB') : 'Pending'}`);

    // Signature block
    doc.moveDown(2);
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica')
      .text('Referee Signature:', 50, doc.y);
    doc.moveTo(160, doc.y).lineTo(350, doc.y).strokeColor(primaryColor).lineWidth(1).stroke();
    doc.moveDown(0.3);
    doc.fillColor(mutedColor).fontSize(9).text(referee.fullName, 160, doc.y);

    doc.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function populateReport(report) {
  if (!report) return null;
  return report.populate([
    { path: 'raceId', select: 'name grade scheduledTime status tournamentId distance purse' },
    { path: 'refereeId', select: 'fullName email refereeProfile' },
    { path: 'incidents.horseId', select: 'name breed' },
  ]);
}

module.exports = {
  getAssignedRaces,
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  addIncident,
  removeIncident,
  submitReport,
  generateReportPdf,
};
```

---

### B7. `backend/src/controllers/referee.controller.js` (FULL)

```js
const refereeService = require('../services/referee.service');
const { sendSuccess } = require('../utils/response');

async function getAssignedRaces(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await refereeService.getAssignedRaces(req.user._id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function createReport(req, res, next) {
  try {
    const report = await refereeService.createReport(req.user._id, req.body.raceId);
    sendSuccess(res, report, 201, 'Report created');
  } catch (error) {
    next(error);
  }
}

async function getMyReports(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await refereeService.getMyReports(req.user._id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getReportById(req, res, next) {
  try {
    const report = await refereeService.getReportById(req.params.id, req.user._id, req.user.role);
    sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
}

async function updateReport(req, res, next) {
  try {
    const report = await refereeService.updateReport(req.params.id, req.user._id, req.body);
    sendSuccess(res, report, 200, 'Report updated');
  } catch (error) {
    next(error);
  }
}

async function addIncident(req, res, next) {
  try {
    const report = await refereeService.addIncident(req.params.id, req.user._id, req.body);
    sendSuccess(res, report, 201, 'Incident recorded');
  } catch (error) {
    next(error);
  }
}

async function removeIncident(req, res, next) {
  try {
    const report = await refereeService.removeIncident(req.params.id, req.user._id, req.params.incidentId);
    sendSuccess(res, report, 200, 'Incident removed');
  } catch (error) {
    next(error);
  }
}

async function submitReport(req, res, next) {
  try {
    const report = await refereeService.submitReport(req.params.id, req.user._id);
    sendSuccess(res, report, 200, 'Report submitted');
  } catch (error) {
    next(error);
  }
}

async function downloadReportPdf(req, res, next) {
  try {
    const pdfBuffer = await refereeService.generateReportPdf(req.params.id, req.user._id, req.user.role);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="referee-report-${req.params.id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssignedRaces,
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  addIncident,
  removeIncident,
  submitReport,
  downloadReportPdf,
};
```

---

### B8. `backend/src/routes/referee.routes.js` (FULL)

```js
const { Router } = require('express');
const { z } = require('zod');
const refereeController = require('../controllers/referee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

// Referee only (except GET report by id which also allows admin)
router.use(authenticate);

// ── UC-R2: Assigned races ─────────────────────────────────────────────────────
router.get('/races', authorize('referee'), refereeController.getAssignedRaces);

// ── UC-R7: Referee reports ────────────────────────────────────────────────────
const createReportSchema = z.object({
  raceId: z.string().min(1),
});

const updateReportSchema = z.object({
  preCheckSummary: z.string().max(2000).optional(),
  overallNotes: z.string().max(2000).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

// ── UC-R5: Incidents ──────────────────────────────────────────────────────────
const incidentSchema = z.object({
  registrationId: z.string().min(1).optional(),
  type: z.enum(['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other']),
  description: z.string().min(1).max(1000),
  action: z.string().max(500).optional(),
});

router.post('/reports', authorize('referee'), validate(createReportSchema), refereeController.createReport);
router.get('/reports', authorize('referee'), refereeController.getMyReports);
router.get('/reports/:id', authorize('referee', 'admin'), refereeController.getReportById);
router.patch('/reports/:id', authorize('referee'), validate(updateReportSchema), refereeController.updateReport);
router.post('/reports/:id/submit', authorize('referee'), refereeController.submitReport);
router.get('/reports/:id/pdf', authorize('referee', 'admin'), refereeController.downloadReportPdf);

// Incidents
router.post('/reports/:id/incidents', authorize('referee'), validate(incidentSchema), refereeController.addIncident);
router.delete('/reports/:id/incidents/:incidentId', authorize('referee'), refereeController.removeIncident);

module.exports = router;
```

---

### B9. `backend/src/jobs/raceStatus.job.js` (FULL)

```js
const cron = require('node-cron');
const { Race } = require('../models/race.model');
const { CRON_INTERVALS } = require('../config/constants');
const { runRaceSimulation } = require('../services/race-simulation.service');

function startRaceStatusJob() {
  cron.schedule(`*/${CRON_INTERVALS.raceCheckSeconds} * * * * *`, async () => {
    try {
      // 1. Auto-close open races past cutoffTime
      const closed = await Race.updateMany(
        { status: 'open', cutoffTime: { $lte: new Date() } },
        { $set: { status: 'closed' } },
      );
      if (closed.modifiedCount > 0) {
        console.log(`[cron] Auto-closed ${closed.modifiedCount} race(s)`);
      }

      // 2. Auto-start simulation for pre_check races past scheduledTime
      // Set status to 'running' atomically to prevent duplicate starts across ticks
      const racesToStart = await Race.find({
        status: 'pre_check',
        scheduledTime: { $lte: new Date() },
      }).lean();

      for (const race of racesToStart) {
        const updated = await Race.findOneAndUpdate(
          { _id: race._id, status: 'pre_check' },
          { $set: { status: 'running' } },
          { new: false },
        );
        if (!updated) continue; // another process already grabbed it

        console.log(`[cron] Starting simulation for race "${race.name}" (${race._id})`);
        runRaceSimulation(race._id).catch((err) => {
          console.error(`[simulation] Race ${race._id} failed:`, err.message);
        });
      }
    } catch (err) {
      console.error('[cron] raceStatus job error:', err.message);
    }
  });

  console.log('[cron] Race status job started (every 30s)');
}

module.exports = { startRaceStatusJob };
```

---

### B10. Transition closed → pre_check + forceSimulate — snippet từ `race.service.js`

```js
const ALLOWED_MANUAL_TRANSITIONS = {
  open: 'closed',
  closed: 'pre_check',
};

async function updateRaceStatus(raceId, newStatus) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const expected = ALLOWED_MANUAL_TRANSITIONS[race.status];
  if (expected !== newStatus) {
    throw new AppError(400, `Không thể chuyển trạng thái từ '${race.status}' sang '${newStatus}'`);
  }

  if (newStatus === 'pre_check') {
    if (!race.refereeId) {
      throw new AppError(400, 'Phải phân công trọng tài trước khi chuyển sang giai đoạn kiểm tra');
    }
    const { Registration } = require('../models/registration.model');
    const activeCount = await Registration.countDocuments({ raceId, status: 'active' });
    if (activeCount < 2) {
      throw new AppError(400, `Cần ít nhất 2 ngựa đăng ký để bắt đầu kiểm tra trước race (hiện có ${activeCount} ngựa)`);
    }
  }

  race.status = newStatus;
  await race.save();
  return race.populate('tournamentId', 'name status');
}

// Admin force-start: auto-pass pending + run simulation
async function forceSimulateRace(raceId) {
  await Registration.updateMany(
    { raceId, status: 'active', 'preCheckResult.status': 'pending' },
    { $set: { 'preCheckResult.status': 'passed', 'preCheckResult.checkedAt': new Date() } },
  );
  await Race.findByIdAndUpdate(raceId, { $set: { status: 'running' } });
  runRaceSimulation(raceId).catch(...);
}
```

---

### B11. Simulation filter ngựa passed — snippet từ `race-simulation.service.js`

```js
const registrations = await Registration.find({
  raceId,
  status: 'active',
  'preCheckResult.status': 'passed',
})
  .populate('horseId')
  .populate('jockeyId', 'fullName jockeyProfile');

if (registrations.length < 2) {
  // race → cancelled + refundRaceBets
}
```

---

### B12. Constants refund — `backend/src/config/constants.js`

```js
const REFUND_RATES = {
  ownerCancel: 0.4,
  disqualifyOwner: 0.7,      // pre-check failed → owner 70%
  disqualifySpectator: 1.0,  // spec: 100% bet — chưa wire vào updatePreCheck
  cancelled: 1.0,
};
```

---

## C. CODE — FRONTEND

---

### C1. `frontend/src/app/api/registration.ts` (FULL)

```ts
import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';

export interface Registration {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; tournamentId?: string };
  horseId: { _id: string; name: string; breed: string; gender: string; currentGrade: string; imageUrl?: string };
  ownerId: { _id: string; fullName: string; email: string };
  jockeyId?: { _id: string; fullName: string; email: string; jockeyProfile?: { experienceYears: number; weight: number } } | null;
  feePaid: number;
  status: 'active' | 'cancelled' | 'disqualified';
  preCheckResult: { status: 'pending' | 'passed' | 'failed'; note: string; checkedAt?: string };
  registeredAt: string;
  cancelledAt?: string;
  refundAmount: number;
}

export interface RegistrationListResponse {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const registrationApi = {
  register: async (token: string, data: { raceId: string; horseId: string; jockeyId?: string }): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getMyRegistrations: async (
    token: string,
    params: { page?: number; limit?: number; status?: string; raceId?: string } = {},
  ): Promise<RegistrationListResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    if (params.raceId) q.append('raceId', params.raceId);
    const res = await fetch(`${API_URL}/registrations?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getById: async (token: string, id: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  assignJockey: async (token: string, registrationId: string, jockeyId: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}/assign-jockey`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ jockeyId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  cancel: async (token: string, registrationId: string): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  updatePreCheck: async (
    token: string,
    registrationId: string,
    data: { status: 'passed' | 'failed'; note?: string },
  ): Promise<Registration> => {
    const res = await fetch(`${API_URL}/registrations/${registrationId}/pre-check`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },
};
```

---

### C2. `frontend/src/app/api/referee.ts` (FULL)

```ts
import { API_URL } from './auth';
import { getApiErrorMessage } from '../utils/errorMessages';
import type { Race } from './race';

export interface Incident {
  _id: string;
  registrationId?: string;
  horseId?: { _id: string; name: string; breed: string } | null;
  type: 'interference' | 'doping' | 'equipment_violation' | 'jockey_violation' | 'other';
  description: string;
  action?: string;
  recordedAt: string;
}

export interface RefereeReport {
  _id: string;
  raceId: { _id: string; name: string; grade: string; scheduledTime: string; status: string; distance: number; purse: number; tournamentId?: string };
  refereeId: { _id: string; fullName: string; email: string; refereeProfile?: { licenseNumber?: string; yearsOfService?: number } };
  incidents: Incident[];
  preCheckSummary: string;
  overallNotes: string;
  status: 'draft' | 'submitted';
  submittedAt?: string;
  createdAt: string;
}

export interface RefereeReportListResponse {
  reports: RefereeReport[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AssignedRacesResponse {
  races: Race[];
  total: number;
  page: number;
  totalPages: number;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const refereeApi = {
  getAssignedRaces: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<AssignedRacesResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    const res = await fetch(`${API_URL}/referee/races?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  createReport: async (token: string, raceId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ raceId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getMyReports: async (
    token: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ): Promise<RefereeReportListResponse> => {
    const q = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) q.append('status', params.status);
    const res = await fetch(`${API_URL}/referee/reports?${q}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  getReportById: async (token: string, id: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, { headers: authHeader(token) });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  updateReport: async (
    token: string,
    id: string,
    data: { preCheckSummary?: string; overallNotes?: string },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  addIncident: async (
    token: string,
    reportId: string,
    data: { type: Incident['type']; description: string; action?: string; registrationId?: string },
  ): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  removeIncident: async (token: string, reportId: string, incidentId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/incidents/${incidentId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  submitReport: async (token: string, reportId: string): Promise<RefereeReport> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/submit`, {
      method: 'POST',
      headers: authHeader(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(getApiErrorMessage(json.message));
    return json.data;
  },

  downloadPdf: async (token: string, reportId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/referee/reports/${reportId}/pdf`, { headers: authHeader(token) });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage((json as any).message));
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referee-report-${reportId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
```

---

### C3. `frontend/src/app/pages/RefereeDashboard.tsx` (FULL)

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pagination } from '../components/Pagination';
import { useNavigate, useLocation } from 'react-router';
import {
  Shield, Calendar, AlertTriangle, CheckCircle, LogOut, Menu, X,
  FileText, Clock, Flag, Activity, ClipboardCheck, Download,
  Search, User, Award, Scale, Stethoscope, BadgeCheck, Star,
} from 'lucide-react';
import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, FormGroup, Divider, CircularProgress,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { AppShell, type NavItem } from '../components/layout/AppShell';
import { Home, Trophy as TrophyIcon, Medal as MedalIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { refereeApi, type RefereeReport, type Incident } from '../api/referee';
import { registrationApi, type Registration } from '../api/registration';
import { raceApi } from '../api/race';
import { toast } from 'sonner';

// ── Check categories (same as before) ─────────────────────────────────────────
const checkCategories = [
  { key: 'eligibility', title: 'Tư Cách & Giấy Tờ', icon: BadgeCheck, color: 'blue',
    items: [
      { key: 'passport', label: 'Hộ chiếu ngựa hợp lệ & đã xác minh' },
      { key: 'vaccination', label: 'Tiêm phòng đầy đủ (cúm ngựa, uốn ván)' },
      { key: 'grade_eligible', label: 'Đủ điều kiện cấp bậc cho cuộc đua' },
      { key: 'ownership', label: 'Giấy tờ sở hữu khớp với đăng ký' },
    ]
  },
  { key: 'health', title: 'Kiểm Tra Sức Khỏe', icon: Stethoscope, color: 'green',
    items: [
      { key: 'no_lameness', label: 'Không có dấu hiệu khập khễnh hoặc chấn thương' },
      { key: 'vital_signs', label: 'Nhịp tim & nhiệt độ trong giới hạn bình thường' },
      { key: 'coat_condition', label: 'Tình trạng lông bờm bình thường, không có vết thương hở' },
      { key: 'eyes_clear', label: 'Mắt sáng, không chảy dịch bất thường' },
      { key: 'breathing', label: 'Hô hấp đều đặn, không có tiếng bất thường' },
    ]
  },
  { key: 'doping', title: 'Kiểm Tra Doping', icon: Activity, color: 'purple',
    items: [
      { key: 'sample_collected', label: 'Đã lấy mẫu xét nghiệm theo quy định' },
      { key: 'no_prohibited', label: 'Không phát hiện chất bị cấm tại chỗ' },
      { key: 'vet_clearance', label: 'Bác sĩ thú y đã ký giấy thông qua' },
    ]
  },
  { key: 'equipment', title: 'Thiết Bị & Kỵ Sĩ', icon: Scale, color: 'orange',
    items: [
      { key: 'saddle_weight', label: 'Tổng trọng lượng yên cương đúng quy định' },
      { key: 'bit_check', label: 'Hàm thiếc hợp lệ theo quy định chủng loại' },
      { key: 'jockey_license', label: 'Giấy phép kỵ sĩ còn hiệu lực' },
      { key: 'jockey_weight', label: 'Cân nặng kỵ sĩ + thiết bị đạt chuẩn' },
      { key: 'silks', label: 'Màu áo kỵ sĩ khớp với đăng ký chủ ngựa' },
    ]
  },
];

const INCIDENT_TYPES = [
  { value: 'interference', label: 'Cản trở' },
  { value: 'doping', label: 'Doping' },
  { value: 'equipment_violation', label: 'Vi phạm thiết bị' },
  { value: 'jockey_violation', label: 'Vi phạm kỵ sĩ' },
  { value: 'other', label: 'Khác' },
];

const REFEREE_NAV: NavItem[] = [
  { to: '/referee', label: 'Tổng Quan', icon: <Home /> },
  { to: '/referee/pre-check', label: 'Kiểm Tra Trước Đua', icon: <ClipboardCheck /> },
  { to: '/referee/reports', label: 'Báo Cáo Chính Thức', icon: <FileText /> },
];

export function RefereeDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  const { pathname } = useLocation();
  const activeTab = pathname === '/referee/reports' ? 'reports'
    : pathname === '/referee/pre-check' ? 'pre-check'
    : 'overview';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Pre-check state ──
  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [racePage, setRacePage] = useState(1);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [selectedRegIdx, setSelectedRegIdx] = useState(0);
  const [checkItems, setCheckItems] = useState<Record<string, Record<string, boolean>>>({});
  const [horseNotes, setHorseNotes] = useState<Record<string, string>>({});
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [submittingCheck, setSubmittingCheck] = useState(false);

  // ── Reports state ──
  const [reports, setReports] = useState<RefereeReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [createReportDialog, setCreateReportDialog] = useState(false);
  const [selectedReportRaceId, setSelectedReportRaceId] = useState('');
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [activeReport, setActiveReport] = useState<RefereeReport | null>(null);
  const [newIncident, setNewIncident] = useState({ type: 'interference' as Incident['type'], description: '', action: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  // ── Stats ──
  const stats = [
    { label: 'Race Được Phân Công', value: String(assignedRaces.length), icon: ClipboardCheck, color: 'from-[#C9A227] to-[#b8960a]' },
    { label: 'Chờ Kiểm Tra', value: String(assignedRaces.filter(r => r.status === 'pre_check').length), icon: Clock, color: 'from-amber-500 to-amber-700' },
    { label: 'Sự Cố Ghi Nhận', value: String(reports.reduce((s, r) => s + r.incidents.length, 0)), icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Báo Cáo Đã Nộp', value: String(reports.filter(r => r.status === 'submitted').length), icon: CheckCircle, color: 'from-indigo-500 to-indigo-700' },
  ];

  // ── Load data ──
  const loadAssignedRaces = useCallback(async () => {
    if (!token) return;
    setLoadingRaces(true);
    try {
      const res = await refereeApi.getAssignedRaces(token, { limit: 50 });
      setAssignedRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, [token]);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const res = await refereeApi.getMyReports(token, { limit: 50 });
      setReports(res.reports);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  useEffect(() => { loadAssignedRaces(); loadReports(); }, [loadAssignedRaces, loadReports]);
  useEffect(() => { if (activeTab === 'reports') loadReports(); }, [activeTab, loadReports]);

  const initChecksFromRegs = (regs: Registration[]) => {
    const checks: Record<string, Record<string, boolean>> = {};
    regs.forEach(reg => {
      const alreadyDone = reg.preCheckResult?.status !== 'pending';
      checks[reg._id] = {};
      checkCategories.forEach(cat =>
        cat.items.forEach(item => {
          // Pre-fill all as checked if horse already passed; leave empty if pending/failed
          checks[reg._id][item.key] = alreadyDone && reg.preCheckResult?.status === 'passed';
        })
      );
    });
    return checks;
  };

  const handleOpenPreCheck = async (race: any) => {
    setSelectedRace(race);
    setSelectedRegIdx(0);
    setLoadingRegs(true);
    setPreCheckOpen(true);
    try {
      const res = await raceApi.getRaceRegistrations(token!, race._id);
      const regs: Registration[] = res.registrations || [];
      setRegistrations(regs);
      setCheckItems(initChecksFromRegs(regs));
      setHorseNotes({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRegs(false);
    }
  };

  const toggleCheckItem = (regId: string, key: string) =>
    setCheckItems(prev => ({ ...prev, [regId]: { ...prev[regId], [key]: !prev[regId]?.[key] } }));

  const toggleCategoryAll = (regId: string, categoryKey: string) => {
    const category = checkCategories.find(c => c.key === categoryKey);
    if (!category) return;
    setCheckItems(prev => {
      const current = prev[regId] || {};
      const allChecked = category.items.every(item => current[item.key]);
      const next = { ...current };
      category.items.forEach(item => {
        next[item.key] = !allChecked;
      });
      return { ...prev, [regId]: next };
    });
  };

  const getCompletionRate = (regId: string) => {
    const checks = checkItems[regId] || {};
    const total = checkCategories.reduce((a, c) => a + c.items.length, 0);
    const done = Object.values(checks).filter(Boolean).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const handleSubmitPreCheck = async (status: 'passed' | 'failed') => {
    const reg = registrations[selectedRegIdx];
    if (!reg || !token) return;
    setSubmittingCheck(true);
    try {
      await registrationApi.updatePreCheck(token, reg._id, {
        status,
        note: horseNotes[reg._id] || '',
      });
      toast.success(`Đã ${status === 'passed' ? 'đánh dấu ĐẠT' : 'đánh dấu KHÔNG ĐẠT'} cho ${(reg.horseId as any)?.name}`);
      // Update only this registration's preCheckResult in local state (no full reset)
      setRegistrations(prev =>
        prev.map(r => r._id === reg._id
          ? { ...r, preCheckResult: { status, note: horseNotes[reg._id] || '', checkedAt: new Date().toISOString() } }
          : r
        )
      );
      // Auto-advance to next pending horse
      const nextPending = registrations.findIndex(
        (r, i) => i > selectedRegIdx && r.preCheckResult?.status === 'pending'
      );
      if (nextPending !== -1) setSelectedRegIdx(nextPending);
      if (status === 'passed' && selectedRegIdx < registrations.length - 1) setSelectedRegIdx(i => i + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCheck(false);
    }
  };

  // ── Report actions ──
  const handleCreateReport = async () => {
    if (!token || !selectedReportRaceId) return;
    try {
      await refereeApi.createReport(token, selectedReportRaceId);
      toast.success('Đã tạo báo cáo');
      setCreateReportDialog(false);
      setSelectedReportRaceId('');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    if (!token) return;
    try {
      await refereeApi.submitReport(token, reportId);
      toast.success('Báo cáo đã được nộp');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddIncident = async () => {
    if (!token || !activeReport || !newIncident.description) return;
    try {
      await refereeApi.addIncident(token, activeReport._id, newIncident);
      toast.success('Đã ghi nhận sự cố');
      setIncidentDialog(false);
      setNewIncident({ type: 'interference', description: '', action: '' });
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDownloadPdf = async (reportId: string) => {
    if (!token) return;
    setDownloading(reportId);
    try {
      await refereeApi.downloadPdf(token, reportId);
      toast.success('Đang tải PDF...');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const currentReg = registrations[selectedRegIdx];
  const currentChecks = currentReg ? checkItems[currentReg._id] || {} : {};

  const filteredReports = reports.filter(r =>
    (r.raceId as any)?.name?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const REF_PAGE_SIZE = 10;
  const pagedRaces = useMemo(() => assignedRaces.slice((racePage - 1) * REF_PAGE_SIZE, racePage * REF_PAGE_SIZE), [assignedRaces, racePage]);
  const raceTotalPages = Math.ceil(assignedRaces.length / REF_PAGE_SIZE);
  const pagedReports = useMemo(() => filteredReports.slice((reportPage - 1) * REF_PAGE_SIZE, reportPage * REF_PAGE_SIZE), [filteredReports, reportPage]);

  return (
    <AppShell roleLabel="REFEREE" nav={REFEREE_NAV}>
      <div className="max-w-7xl mx-auto">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stats.map((s, i) => (
                <div key={i} className="bg-card border border-border p-5 hover:-translate-y-0.5 transition-transform">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-serif text-2xl font-bold text-foreground mb-1">{s.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Races needing inspection */}
              <div className="bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground">Cuộc Đua Cần Kiểm Tra</h3>
                  <span className="text-xs text-muted-foreground">{assignedRaces.filter(r => r.status === 'pre_check').length} chờ kiểm tra</span>
                </div>
                {loadingRaces ? (
                  <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
                    <div className="w-5 h-5 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : assignedRaces.filter(r => r.status === 'pre_check').length > 0 ? (
                  <div className="space-y-2">
                    {assignedRaces.filter(r => r.status === 'pre_check').slice(0, 4).map((race, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-[#C9A227]/30 bg-[#C9A227]/5 hover:bg-[#C9A227]/10 transition-colors">
                        <div className="w-8 h-8 bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center flex-shrink-0">
                          <ClipboardCheck className="w-4 h-4 text-[#C9A227]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{race.name}</div>
                          <div className="text-xs text-muted-foreground">{race.grade} · {new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <span className="text-xs font-bold text-[#8F7318] px-2 py-0.5 bg-[#C9A227]/10 border border-[#C9A227]/30 flex-shrink-0">Chờ KT</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground text-sm gap-2">
                    <CheckCircle className="w-8 h-8 opacity-30" />
                    Không có cuộc đua nào cần kiểm tra
                  </div>
                )}
              </div>

              {/* Recent reports */}
              <div className="bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground">Báo Cáo Gần Đây</h3>
                  <span className="text-xs text-muted-foreground">{reports.length} báo cáo</span>
                </div>
                {loadingReports ? (
                  <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
                    <div className="w-5 h-5 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.slice(0, 4).map((report, i) => {
                      const isDraft = report.status === 'draft';
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 border border-border hover:bg-muted/40 transition-colors">
                          <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${isDraft ? 'bg-[#C9A227]/10 border border-[#C9A227]/30' : 'bg-[#1F3D2B]/10 border border-[#1F3D2B]/30'}`}>
                            <FileText className={`w-4 h-4 ${isDraft ? 'text-[#C9A227]' : 'text-[#1F3D2B]'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{(report.raceId as any)?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{report.incidents.length} sự cố · {new Date(report.createdAt).toLocaleDateString('vi-VN')}</div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 flex-shrink-0 ${isDraft ? 'text-[#8F7318] bg-[#C9A227]/10 border border-[#C9A227]/30' : 'text-[#1F3D2B] bg-[#1F3D2B]/10 border border-[#1F3D2B]/30'}`}>
                            {isDraft ? 'Nháp' : 'Đã nộp'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground text-sm gap-2">
                    <FileText className="w-8 h-8 opacity-30" />
                    Chưa có báo cáo nào
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions + upcoming races */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-5">
                <h3 className="font-serif text-base font-bold text-foreground mb-4">Lịch Race Sắp Tới</h3>
                {assignedRaces.filter(r => ['open', 'closed', 'pre_check'].includes(r.status)).length > 0 ? (
                  <div className="space-y-2">
                    {assignedRaces.filter(r => ['open', 'closed', 'pre_check'].includes(r.status)).slice(0, 3).map((race, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 border border-border hover:bg-muted/40 transition-colors">
                        <div className="w-7 h-7 bg-[#1F3D2B]/10 border border-[#1F3D2B]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1F3D2B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{race.name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground text-sm gap-2">
                    <Calendar className="w-7 h-7 opacity-30" />
                    Không có lịch sắp tới
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-card border border-border p-5">
                <h3 className="font-serif text-base font-bold text-foreground mb-4">Thao Tác Nhanh</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Kiểm Tra Ngựa', icon: ClipboardCheck, to: '/referee/pre-check', badge: (assignedRaces.filter(r => r.status === 'pre_check').length || null) as number | null },
                    { label: 'Xem Báo Cáo', icon: FileText, to: '/referee/reports', badge: null as number | null },
                    { label: 'Cuộc Đua Được Phân Công', icon: Flag, to: '/referee/pre-check', badge: null as number | null },
                    { label: 'Ghi Nhận Sự Cố', icon: AlertTriangle, to: '/referee/reports', badge: (reports.filter(r => r.status === 'draft').length || null) as number | null },
                  ].map((action, i) => (
                    <button key={i} onClick={() => navigate(action.to)}
                      className="flex items-center gap-3 p-4 border border-border hover:border-[#C9A227]/40 hover:bg-muted/40 transition-all text-left group">
                      <div className="w-9 h-9 bg-[#1F3D2B]/10 border border-[#1F3D2B]/20 flex items-center justify-center group-hover:bg-[#1F3D2B]/20 transition-colors flex-shrink-0">
                        <action.icon className="w-4 h-4 text-[#1F3D2B]" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                      {action.badge ? (
                        <span className="text-xs font-bold text-white bg-[#8C2F1B] px-1.5 py-0.5">{action.badge}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Pre-check ── */}
        {activeTab === 'pre-check' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Kiểm Tra Trước Đua</h2>
              <p className="text-slate-400">Race được phân công cho bạn</p>
            </div>
            {loadingRaces ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
            ) : assignedRaces.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Bạn chưa được phân công cuộc đua nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagedRaces.map(race => {
                  const isPrecheckable = race.status === 'pre_check';
                  return (
                    <div key={race._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 hover:border-[#C9A227]/30 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ClipboardCheck className="w-5 h-5 text-[#C9A227]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-xl font-bold text-foreground">{race.name}</h3>
                                <Chip label={race.grade} size="small" sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                <Chip label={race.status === 'pre_check' ? 'Cần Kiểm Tra' : race.status} size="small"
                                  sx={{ bgcolor: isPrecheckable ? 'rgba(201,162,39,0.2)' : 'rgba(100,116,139,0.2)', color: isPrecheckable ? '#8F7318' : '#7A7468', border: `1px solid ${isPrecheckable ? '#C9A227' : '#475569'}`, fontWeight: 'bold' }} />
                              </div>
                              <div className="text-slate-400 text-sm mt-0.5">
                                {new Date(race.scheduledTime).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-xl border border-border">
                            <div><div className="text-slate-500 text-xs mb-1">Cự Ly</div><div className="text-foreground font-medium text-sm">{race.distance}m</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Giải Thưởng</div><div className="text-[#C9A227] font-semibold text-sm">{race.purse?.toLocaleString('vi-VN')} coins</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Phí ĐK</div><div className="text-foreground font-medium text-sm">{race.registrationFee?.toLocaleString('vi-VN')} coins</div></div>
                            <div className="flex items-end justify-end">
                              <Button variant="contained" disabled={!isPrecheckable}
                                onClick={() => handleOpenPreCheck(race)}
                                sx={{ background: isPrecheckable ? '#C9A227' : '#EDE7D8', color: isPrecheckable ? '#23201A' : 'white', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', '&:hover': { background: '#f0d000' } }}>
                                {isPrecheckable ? 'Bắt Đầu Kiểm Tra' : 'Chưa Đến Lượt'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination page={racePage} totalPages={raceTotalPages} onPageChange={setRacePage} />
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Reports ── */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="font-serif text-3xl font-bold text-foreground">Báo Cáo Chính Thức</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Tìm theo tên cuộc đua..."
                    value={reportSearch} onChange={e => { setReportSearch(e.target.value); setReportPage(1); }}
                    className="bg-slate-900 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-slate-500 focus:outline-none focus:border-[#C9A227] text-sm w-56" />
                </div>
                <Button variant="contained" onClick={() => setCreateReportDialog(true)}
                  sx={{ background: '#C9A227', color: '#23201A', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#f0d000' } }}>
                  + Tạo Báo Cáo
                </Button>
              </div>
            </div>

            {loadingReports ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Chưa có báo cáo nào</p>
              </div>
            ) : (
              <>
              <div className="bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/80 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Cuộc Đua</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Ngày Tạo</th>
                      <th className="text-center px-4 py-4 text-sm font-semibold text-slate-400">Sự Cố</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-slate-400">Trạng Thái</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedReports.map(report => {
                      const isDraft = report.status === 'draft';
                      return (
                        <tr key={report._id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-foreground font-medium">{(report.raceId as any)?.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{(report.raceId as any)?.grade}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold ${report.incidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{report.incidents.length}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Chip label={isDraft ? 'Nháp' : 'Đã nộp'} size="small"
                              sx={{ bgcolor: isDraft ? 'rgba(201,162,39,0.15)' : 'rgba(16,185,129,0.15)', color: isDraft ? '#8F7318' : '#34d399', border: `1px solid ${isDraft ? '#C9A227' : '#1F3D2B'}`, fontWeight: 'bold' }} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isDraft && (
                                <>
                                  <Button size="small" variant="outlined" onClick={() => { setActiveReport(report); setIncidentDialog(true); }}
                                    sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#C9A227', color: '#C9A227' } }}>
                                    + Sự Cố
                                  </Button>
                                  <Button size="small" variant="outlined" onClick={() => handleSubmitReport(report._id)}
                                    sx={{ borderColor: '#1F3D2B', color: '#34d399', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}>
                                    Nộp
                                  </Button>
                                </>
                              )}
                              <Button size="small" variant="outlined" startIcon={downloading === report._id ? <CircularProgress size={12} sx={{ color: '#23201A' }} /> : <Download className="w-3 h-3" />}
                                onClick={() => handleDownloadPdf(report._id)} disabled={downloading === report._id}
                                sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#C9A227', color: '#C9A227' } }}>
                                PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={reportPage} totalPages={Math.ceil(filteredReports.length / REF_PAGE_SIZE)} onPageChange={setReportPage} />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Pre-Check Dialog ── */}
      <Dialog open={preCheckOpen} onClose={() => setPreCheckOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '20px', maxHeight: '92vh' } }}>
        <DialogTitle sx={{ color: '#23201A', borderBottom: '1px solid #E3DCCB', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClipboardCheck className="w-5 h-5 text-[#C9A227]" />
          Kiểm Tra Chính Thức — {selectedRace?.name}
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important', overflowY: 'auto' }}>
          {loadingRegs ? (
            <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
          ) : registrations.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Không có ngựa đăng ký</div>
          ) : (
            <div className="flex gap-5" style={{ minHeight: '520px' }}>
              {/* Sidebar */}
              <div className="w-52 flex-shrink-0 border-r border-border pr-4 space-y-2 overflow-y-auto">
                <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-wider">Danh Sách Ngựa</div>
                {registrations.map((reg, idx) => {
                  const horse = reg.horseId as any;
                  const rate = getCompletionRate(reg._id);
                  const preStatus = reg.preCheckResult?.status;
                  return (
                    <div key={reg._id} onClick={() => setSelectedRegIdx(idx)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedRegIdx === idx ? 'bg-[#C9A227]/15 border-[#C9A227]/40' : 'bg-muted/40 border-transparent hover:bg-muted/40'}`}>
                      <div className="text-foreground font-semibold text-sm">{horse?.name || '-'}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{(reg.jockeyId as any)?.fullName || 'Chưa có jockey'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A227] rounded-full transition-all" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{rate}%</span>
                      </div>
                      {preStatus === 'passed' && <div className="flex items-center gap-1 mt-1.5 text-emerald-400 text-xs font-medium"><CheckCircle className="w-3 h-3" /> ĐẠT</div>}
                      {preStatus === 'failed' && <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium"><X className="w-3 h-3" /> KHÔNG ĐẠT</div>}
                    </div>
                  );
                })}
              </div>

              {/* Main */}
              <div className="flex-1 overflow-y-auto pl-1">
                {currentReg && (() => {
                  const horse = currentReg.horseId as any;
                  const jockey = currentReg.jockeyId as any;
                  return (
                    <>
                      <div className="bg-slate-900/70 rounded-2xl border border-border p-5 mb-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-serif text-xl font-bold text-foreground">{horse?.name}</h3>
                            <div className="text-slate-400 text-sm">{horse?.breed} · {horse?.gender} · {horse?.currentGrade}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#C9A227] font-bold text-lg">{getCompletionRate(currentReg._id)}%</div>
                            <div className="text-slate-500 text-xs">hoàn thành</div>
                          </div>
                        </div>
                        {jockey && (
                          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 text-sm">
                            <div className="text-blue-400 font-bold uppercase text-xs mb-2">Kỵ Sĩ</div>
                            <div className="text-foreground font-medium">{jockey.fullName}</div>
                            {jockey.jockeyProfile && (
                              <div className="text-slate-400 text-xs mt-1">{jockey.jockeyProfile.experienceYears} năm KN · {jockey.jockeyProfile.weight} kg</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Checklist */}
                      <div className="space-y-4">
                        {checkCategories.map(cat => {
                          const done = cat.items.filter(i => currentChecks[i.key]).length;
                          const allChecked = done === cat.items.length;
                          const colorMap: Record<string, string> = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20', orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
                          return (
                            <div key={cat.key} className="bg-slate-900/50 rounded-xl border border-border overflow-hidden">
                              <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${colorMap[cat.color]}`}>
                                <div className="flex items-center gap-2"><cat.icon className="w-4 h-4" /><span className="font-semibold text-sm">{cat.title}</span></div>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleCategoryAll(currentReg._id, cat.key)}
                                    className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                                  >
                                    {allChecked ? 'Bỏ chọn' : 'Chọn tất cả'}
                                  </button>
                                  <span className="text-xs font-mono">{done}/{cat.items.length}</span>
                                </div>
                              </div>
                              <div className="p-3 space-y-1">
                                {cat.items.map(item => (
                                  <label key={item.key} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${currentChecks[item.key] ? 'bg-emerald-500/8' : 'hover:bg-muted/40'}`}>
                                    <input type="checkbox" checked={!!currentChecks[item.key]} onChange={() => toggleCheckItem(currentReg._id, item.key)} className="w-4 h-4 accent-[#C9A227] cursor-pointer flex-shrink-0" />
                                    <span className={`text-sm ${currentChecks[item.key] ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-300'}`}>{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <label className="text-slate-400 text-sm font-medium mb-2 block">Ghi Chú (tùy chọn)</label>
                        <textarea value={horseNotes[currentReg._id] || ''} onChange={e => setHorseNotes(prev => ({ ...prev, [currentReg._id]: e.target.value }))}
                          placeholder="Nhập ghi chú kiểm tra..."
                          rows={3} className="w-full bg-slate-900/70 border border-border rounded-xl px-4 py-3 text-foreground placeholder-slate-600 text-sm focus:outline-none focus:border-[#C9A227]/50 resize-none" />
                      </div>

                      {currentReg.preCheckResult?.status === 'passed' ? (
                        <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-4">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold text-lg">ĐÃ ĐẠT — Kiểm tra hoàn thành</span>
                        </div>
                      ) : currentReg.preCheckResult?.status === 'failed' ? (
                        <div className="mt-4 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl py-4">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-bold text-lg">KHÔNG ĐẠT — Ngựa bị loại</span>
                        </div>
                      ) : (
                        <div className="flex gap-3 mt-4">
                          <Button variant="contained" fullWidth startIcon={<CheckCircle />} disabled={submittingCheck}
                            sx={{ background: '#1F3D2B', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#172D20' } }}
                            onClick={() => handleSubmitPreCheck('passed')}>
                            {submittingCheck ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Đánh Dấu ĐẠT'}
                          </Button>
                          <Button variant="outlined" fullWidth startIcon={<AlertTriangle />} disabled={submittingCheck}
                            sx={{ borderColor: '#B42318', color: '#B42318', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: 'rgba(180,35,24,0.1)', borderColor: '#dc2626' } }}
                            onClick={() => handleSubmitPreCheck('failed')}>
                            {submittingCheck ? <CircularProgress size={20} sx={{ color: '#B42318' }} /> : 'Đánh Dấu KHÔNG ĐẠT'}
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #E3DCCB', padding: '16px 24px', gap: 1 }}>
          {registrations.length > 0 && registrations.every(r => r.preCheckResult?.status !== 'pending') && (
            <div className="flex-1 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                Đã kiểm tra {registrations.filter(r => r.preCheckResult?.status === 'passed').length}/{registrations.length} ngựa đạt tiêu chuẩn
              </span>
            </div>
          )}
          <Button onClick={() => setPreCheckOpen(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Create Report Dialog ── */}
      <Dialog open={createReportDialog} onClose={() => setCreateReportDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: '#23201A' }}>Tạo Báo Cáo Mới</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#7A7468' }}>Chọn cuộc đua</InputLabel>
              <Select value={selectedReportRaceId} label="Chọn cuộc đua"
                onChange={e => setSelectedReportRaceId(e.target.value)}
                sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}>
                {assignedRaces.map(r => (
                  <MenuItem key={r._id} value={r._id}>{r.name} ({r.grade})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setCreateReportDialog(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" onClick={handleCreateReport} disabled={!selectedReportRaceId}
            sx={{ background: '#C9A227', color: '#23201A', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#f0d000' } }}>
            Tạo Báo Cáo
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Incident Dialog ── */}
      <Dialog open={incidentDialog} onClose={() => setIncidentDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: '#23201A' }}>Ghi Nhận Sự Cố — {(activeReport?.raceId as any)?.name}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#7A7468' }}>Loại sự cố</InputLabel>
              <Select value={newIncident.type} label="Loại sự cố"
                onChange={e => setNewIncident(p => ({ ...p, type: e.target.value as Incident['type'] }))}
                sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}>
                {INCIDENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth multiline rows={3} label="Mô tả sự cố *" value={newIncident.description}
              onChange={e => setNewIncident(p => ({ ...p, description: e.target.value }))}
              sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
            <TextField fullWidth label="Hành động xử lý" value={newIncident.action}
              onChange={e => setNewIncident(p => ({ ...p, action: e.target.value }))}
              sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setIncidentDialog(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" onClick={handleAddIncident} disabled={!newIncident.description}
            sx={{ background: '#B42318', color: 'white', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#dc2626' } }}>
            Ghi Nhận
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
```
