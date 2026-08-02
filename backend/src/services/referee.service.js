const PDFDocument = require('pdfkit');
const { RefereeReport } = require('../models/referee_report.model');
const { Race } = require('../models/race.model');
const { Registration } = require('../models/registration.model');
const { User } = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const { PRE_RACE_TRACK_CONDITIONS, PENALTY_REASON_CODES, POST_RACE_VET_ORDER_TYPES } = require('../config/constants');
const {
  migratePreCheckSummary,
  migrateSubmittedStatus,
  isReportEditable,
} = require('./referee-prerace.helper');
const { createNotification } = require('./notification.service');
const { applyJockeySuspension } = require('./jockey-suspension.helper');
const { isPreRaceEditable } = require('./race-prerace-gate.helper');

function assertEditable(report) {
  migrateSubmittedStatus(report);
  if (!isReportEditable(report.status)) {
    throw new AppError(400, 'Không thể chỉnh sửa báo cáo ở trạng thái hiện tại');
  }
}

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
  const report = await RefereeReport.findById(reportId);
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');

  const isReferee = report.refereeId.toString() === userId;
  if (!isReferee && role !== 'admin') throw new AppError(403, 'Bạn không có quyền truy cập');

  let dirty = migrateSubmittedStatus(report);
  if (migratePreCheckSummary(report) && isReportEditable(report.status)) dirty = true;
  if (dirty) await report.save();

  return populateReport(report);
}

async function updateReport(reportId, refereeId, { overallNotes, preRaceReport, postRaceReport }) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');

  migratePreCheckSummary(report);
  migrateSubmittedStatus(report);

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  const raceStarted = ['running', 'finished', 'cancelled'].includes(race.status);
  const preStatus = report.preRaceStatus || 'draft';

  if (preRaceReport && typeof preRaceReport === 'object') {
    if (raceStarted) {
      throw new AppError(400, 'Không thể sửa Báo cáo trước trận sau khi cuộc đua đã bắt đầu');
    }
    if (!isPreRaceEditable(preStatus)) {
      throw new AppError(400, 'Báo cáo trước trận đang chờ duyệt hoặc đã được duyệt — không thể sửa');
    }
    if (!report.preRaceReport) report.preRaceReport = {};
    const pr = report.preRaceReport;
    if (preRaceReport.trackCondition !== undefined) pr.trackCondition = preRaceReport.trackCondition;
    if (preRaceReport.trackConditionNote !== undefined) pr.trackConditionNote = preRaceReport.trackConditionNote;
    if (preRaceReport.riderChanges !== undefined) pr.riderChanges = preRaceReport.riderChanges;
    if (preRaceReport.gearChanges !== undefined) pr.gearChanges = preRaceReport.gearChanges;
    if (preRaceReport.vetChecks !== undefined) pr.vetChecks = preRaceReport.vetChecks;
  }

  if (postRaceReport && typeof postRaceReport === 'object') {
    if (race.status !== 'finished') {
      throw new AppError(400, 'Báo cáo sau trận chỉ được sửa khi cuộc đua đã finished');
    }
    assertEditable(report);
    if (!report.postRaceReport) report.postRaceReport = {};
    const po = report.postRaceReport;
    if (postRaceReport.performanceExplanations !== undefined) {
      po.performanceExplanations = postRaceReport.performanceExplanations;
    }
    if (postRaceReport.vetOrders !== undefined) {
      for (const order of postRaceReport.vetOrders) {
        if (!POST_RACE_VET_ORDER_TYPES.includes(order.orderType)) {
          throw new AppError(400, `orderType không hợp lệ: ${order.orderType}`);
        }
      }
      po.vetOrders = postRaceReport.vetOrders;
    }
  }

  if (overallNotes !== undefined) {
    const preOk = isPreRaceEditable(preStatus) && !raceStarted;
    const postOk = isReportEditable(report.status) && race.status === 'finished';
    if (!preOk && !postOk) {
      throw new AppError(400, 'Không thể sửa ghi chú ở trạng thái hiện tại');
    }
    report.overallNotes = overallNotes;
  }

  await report.save();
  return populateReport(report);
}

// ── UC-R5: Ghi nhận incidents ─────────────────────────────────────────────────

async function addIncident(reportId, refereeId, incidentData) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  assertEditable(report);

  // Validate registrationId belongs to this race if provided
  if (incidentData.registrationId) {
    const reg = await Registration.findOne({ _id: incidentData.registrationId, raceId: report.raceId });
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký trong cuộc đua này');
    incidentData.horseId = reg.horseId;
  }

  report.incidents.push({
    ...incidentData,
    source: incidentData.source || 'manual',
    status: incidentData.status || 'resolved',
  });
  await report.save();

  return populateReport(report);
}

async function flagIncident(reportId, refereeId, { registrationId, horseId, raceTimeMs }) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  assertEditable(report);

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'running') {
    throw new AppError(400, 'Chỉ có thể đánh dấu Flag khi cuộc đua đang chạy');
  }

  let reg = null;
  if (registrationId) {
    reg = await Registration.findOne({ _id: registrationId, raceId: report.raceId });
  } else if (horseId) {
    reg = await Registration.findOne({ horseId, raceId: report.raceId, status: { $in: ['active', 'disqualified'] } });
  }
  if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký trong cuộc đua này');

  const now = new Date();
  const regIdStr = reg._id.toString();
  const recent = report.incidents.find((inc) => {
    if (inc.source !== 'live_flag') return false;
    if (!inc.registrationId || inc.registrationId.toString() !== regIdStr) return false;
    const t = inc.flaggedAt || inc.recordedAt;
    return t && now - new Date(t) < 5000;
  });

  if (recent) {
    recent.flaggedAt = now;
    recent.recordedAt = now;
    if (raceTimeMs != null) recent.raceTimeMs = raceTimeMs;
    await report.save();
    return populateReport(report);
  }

  report.incidents.push({
    registrationId: reg._id,
    horseId: reg.horseId,
    type: 'other',
    action: '',
    source: 'live_flag',
    status: 'draft',
    flaggedAt: now,
    recordedAt: now,
    raceTimeMs: raceTimeMs != null ? Number(raceTimeMs) : null,
  });
  await report.save();
  return populateReport(report);
}

/** Ensure draft report exists for assigned referee + race (for live flagging). */
async function ensureDraftReport(refereeId, raceId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Bạn không phải trọng tài được phân công cho cuộc đua này');
  }

  let report = await RefereeReport.findOne({ raceId });
  if (!report) {
    report = await RefereeReport.create({ raceId, refereeId, status: 'draft' });
    return populateReport(report);
  }

  migrateSubmittedStatus(report);
  if (!isReportEditable(report.status)) {
    throw new AppError(400, 'Báo cáo đã khóa — không thể ghi Flag');
  }
  return populateReport(report);
}

async function removeIncident(reportId, refereeId, incidentId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  assertEditable(report);

  const before = report.incidents.length;
  report.incidents = report.incidents.filter((i) => i._id.toString() !== incidentId);
  if (report.incidents.length === before) throw new AppError(404, 'Không tìm thấy sự cố');

  await report.save();
  return populateReport(report);
}

async function updateIncident(reportId, refereeId, incidentId, body = {}) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  assertEditable(report);

  const incident = report.incidents.id(incidentId);
  if (!incident) throw new AppError(404, 'Không tìm thấy sự cố');

  const { type, action } = body;
  if (type !== undefined) incident.type = type;
  if (action !== undefined) incident.action = action;

  await report.save();
  return populateReport(report);
}

async function resolveRegistrationForIncident(report, incident) {
  let reg = null;
  if (incident.registrationId) {
    reg = await Registration.findById(incident.registrationId);
  } else if (incident.horseId) {
    reg = await Registration.findOne({ raceId: report.raceId, horseId: incident.horseId });
  }
  return reg;
}

async function resolveIncident(reportId, refereeId, incidentId, body = {}) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  assertEditable(report);

  const incident = report.incidents.id(incidentId);
  if (!incident) throw new AppError(404, 'Không tìm thấy sự cố');

  const { type, action, resolution } = body;
  if (!resolution || !resolution.verdict) {
    throw new AppError(400, 'resolution.verdict là bắt buộc');
  }

  const allowed = ['none', 'warning', 'fine', 'disqualified'];
  if (!allowed.includes(resolution.verdict)) {
    throw new AppError(400, 'verdict không hợp lệ');
  }

  const reasonCode = resolution.reasonCode ?? null;
  if (reasonCode != null && !PENALTY_REASON_CODES.includes(reasonCode)) {
    throw new AppError(400, 'reasonCode không hợp lệ');
  }

  const suspensionDays =
    resolution.suspensionDays != null && resolution.suspensionDays !== ''
      ? Number(resolution.suspensionDays)
      : null;
  if (suspensionDays != null && (!Number.isFinite(suspensionDays) || suspensionDays < 0)) {
    throw new AppError(400, 'suspensionDays phải >= 0');
  }

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');

  if (type !== undefined) incident.type = type;
  if (action !== undefined) incident.action = action;

  const previousVerdict = incident.resolution?.verdict;

  const reg = await resolveRegistrationForIncident(report, incident);

  if (resolution.verdict === 'fine') {
    const amount = Number(resolution.fineAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(400, 'fineAmount phải > 0 khi verdict = fine');
    }
    const role = resolution.fineTargetRole;
    if (role !== 'owner' && role !== 'jockey') {
      throw new AppError(400, 'fineTargetRole phải là owner hoặc jockey');
    }
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký gắn với sự cố');

    const targetUserId = role === 'owner' ? reg.ownerId : reg.jockeyId;
    if (!targetUserId) throw new AppError(400, 'Không xác định được người nộp phạt (thiếu jockey?)');

    incident.resolution = {
      verdict: 'fine',
      fineAmount: amount,
      fineTargetRole: role,
      fineTargetUserId: targetUserId,
      reasonCode,
      suspensionDays: suspensionDays > 0 ? suspensionDays : null,
      note: resolution.note || '',
      resolvedAt: new Date(),
    };
    incident.status = 'resolved';
    await report.save();

    // Phiếu phạt + treo giò chỉ phát hành khi Admin duyệt báo cáo sau trận
    return populateReport(report);
  }

  incident.resolution = {
    verdict: resolution.verdict,
    fineAmount: null,
    fineTargetRole: null,
    fineTargetUserId: null,
    reasonCode,
    suspensionDays: suspensionDays > 0 ? suspensionDays : null,
    note: resolution.note || '',
    resolvedAt: new Date(),
  };
  incident.status = 'resolved';
  await report.save();

  if (resolution.verdict === 'disqualified' && previousVerdict !== 'disqualified') {
    if (race.status !== 'finished') {
      throw new AppError(400, 'Chỉ DQ sau khi cuộc đua đã finished');
    }
    const { RaceResult } = require('../models/race_result.model');
    const { rebuildOfficialOrder } = require('./race-result-order.helper');

    let result = null;
    if (incident.registrationId) {
      result = await RaceResult.findOne({ raceId: report.raceId, registrationId: incident.registrationId });
    } else if (incident.horseId) {
      result = await RaceResult.findOne({ raceId: report.raceId, horseId: incident.horseId });
    }
    if (!result) throw new AppError(404, 'Không tìm thấy kết quả ngựa để DQ');

    result.disqualified = true;
    await result.save();
    await rebuildOfficialOrder(report.raceId);
  }

  // Treo giò chỉ áp dụng khi Admin duyệt Official
  return populateReport(report);
}

/** UC-R6: Xác nhận kết quả — không set isOfficial, không re-settle */
async function confirmResults(raceId, refereeId) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (!race.refereeId || race.refereeId.toString() !== refereeId) {
    throw new AppError(403, 'Bạn không phải trọng tài được phân công cho cuộc đua này');
  }
  if (race.status !== 'finished') {
    throw new AppError(400, 'Chỉ xác nhận kết quả khi cuộc đua đã finished');
  }

  if (race.resultsConfirmedAt) {
    return race;
  }

  race.resultsConfirmedAt = new Date();
  race.resultsConfirmedBy = refereeId;
  await race.save();
  return race;
}

// ── UC-R7: Submit report ──────────────────────────────────────────────────────

/** Nộp Báo cáo TRƯỚC trận — bắt buộc Admin duyệt trước khi mô phỏng */
async function submitPreRaceReport(reportId, refereeId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, 'Cuộc đua đã bắt đầu/kết thúc — không thể nộp Pre-race Report');
  }

  const preStatus = report.preRaceStatus || 'draft';
  if (!isPreRaceEditable(preStatus)) {
    throw new AppError(400, 'Chỉ nộp Pre-race Report ở trạng thái nháp hoặc bị từ chối');
  }

  migratePreCheckSummary(report);
  const track = report.preRaceReport?.trackCondition || '';
  if (!PRE_RACE_TRACK_CONDITIONS.includes(track)) {
    throw new AppError(400, 'Track Condition is required before submitting Pre-race Report');
  }

  report.preRaceStatus = 'pending_approval';
  report.preRaceSubmittedAt = new Date();
  report.preRaceRejectReason = '';
  await report.save();

  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification(admin._id, {
          type: 'referee_report_pending',
          title: 'Pre-race Report chờ duyệt',
          message: `Báo cáo trước trận của "${race.name}" cần duyệt trước khi chạy mô phỏng.`,
          data: { reportId: report._id, raceId: report.raceId, phase: 'prerace' },
        }).catch(() => null),
      ),
    );
  } catch {
    /* optional */
  }

  return populateReport(report);
}

async function approvePreRaceReport(reportId, adminId) {
  const report = await RefereeReport.findById(reportId);
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');
  if (report.preRaceStatus !== 'pending_approval') {
    throw new AppError(400, 'Chỉ duyệt Pre-race Report đang chờ duyệt');
  }

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (['running', 'finished', 'cancelled'].includes(race.status)) {
    throw new AppError(400, 'Cuộc đua đã bắt đầu — không thể duyệt Pre-race nữa');
  }

  report.preRaceStatus = 'approved';
  report.preRaceReviewedBy = adminId;
  report.preRaceReviewedAt = new Date();
  report.preRaceRejectReason = '';
  await report.save();

  race.preRaceApproved = true;
  await race.save();

  return populateReport(report);
}

async function rejectPreRaceReport(reportId, adminId, reason) {
  const report = await RefereeReport.findById(reportId);
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');
  if (report.preRaceStatus !== 'pending_approval') {
    throw new AppError(400, 'Chỉ từ chối Pre-race Report đang chờ duyệt');
  }
  const trimmed = (reason || '').trim();
  if (!trimmed) throw new AppError(400, 'Lý do từ chối là bắt buộc');

  report.preRaceStatus = 'rejected';
  report.preRaceReviewedBy = adminId;
  report.preRaceReviewedAt = new Date();
  report.preRaceRejectReason = trimmed;
  await report.save();

  await Race.findByIdAndUpdate(report.raceId, { $set: { preRaceApproved: false } });

  return populateReport(report);
}

/** Nộp Báo cáo SAU trận (incidents + postRace) → Admin duyệt Official/payout */
async function submitReport(reportId, refereeId) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId });
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập');
  migrateSubmittedStatus(report);

  if (!['draft', 'rejected'].includes(report.status)) {
    throw new AppError(400, 'Chỉ có thể nộp báo cáo sau trận ở trạng thái nháp hoặc bị từ chối');
  }

  const race = await Race.findById(report.raceId);
  if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
  if (race.status !== 'finished') {
    throw new AppError(400, 'Chỉ nộp Báo cáo sau trận khi cuộc đua đã finished');
  }
  if ((report.preRaceStatus || 'draft') !== 'approved') {
    throw new AppError(400, 'Pre-race Report chưa được duyệt');
  }

  migratePreCheckSummary(report);

  const unresolved = (report.incidents || []).filter((i) => i.status === 'draft');
  if (unresolved.length > 0) {
    throw new AppError(400, `Còn ${unresolved.length} sự cố draft chưa resolve — không thể nộp báo cáo`);
  }

  report.status = 'pending_approval';
  report.submittedBy = refereeId;
  report.submittedAt = new Date();
  report.rejectReason = '';
  await report.save();

  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification(admin._id, {
          type: 'referee_report_pending',
          title: 'Post-race Report chờ duyệt',
          message: `Báo cáo sau trận của "${race.name}" cần duyệt (Official + payout).`,
          data: { reportId: report._id, raceId: report.raceId, phase: 'postrace' },
        }).catch(() => null),
      ),
    );
  } catch {
    /* notification optional */
  }

  return populateReport(report);
}

// ── Admin: list / approve / reject ────────────────────────────────────────────

async function listReportsForAdmin({ page = 1, limit = 10, status, phase } = {}) {
  const filter = {};
  if (phase === 'prerace') {
    if (status === 'pending_approval') {
      filter.preRaceStatus = 'pending_approval';
    } else if (status) {
      filter.preRaceStatus = status;
    } else {
      filter.preRaceStatus = { $in: ['pending_approval', 'rejected', 'approved', 'draft'] };
    }
  } else if (status === 'pending_approval') {
    filter.status = { $in: ['pending_approval', 'submitted'] };
  } else if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    RefereeReport.find(filter)
      .populate('raceId', 'name grade scheduledTime status isOfficial preRaceApproved')
      .populate('refereeId', 'fullName email')
      .populate('submittedBy', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .populate('preRaceReviewedBy', 'fullName email')
      .populate('complaints.submittedBy', 'fullName email')
      .populate('complaints.targetHorseId', 'name')
      .sort(phase === 'prerace' ? { preRaceSubmittedAt: -1, createdAt: -1 } : { submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RefereeReport.countDocuments(filter),
  ]);

  for (const r of reports) {
    if (migrateSubmittedStatus(r)) await r.save();
  }

  return { reports, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

async function approveReport(reportId, adminId) {
  const report = await RefereeReport.findById(reportId);
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');
  migrateSubmittedStatus(report);

  if (report.status !== 'pending_approval') {
    throw new AppError(400, 'Chỉ có thể duyệt báo cáo đang chờ duyệt');
  }

  const mongoose = require('mongoose');
  const { settleOfficialPayouts } = require('./race-payout.service');

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    report.status = 'approved';
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    report.rejectReason = '';
    await report.save({ session });

    await settleOfficialPayouts(report.raceId, session);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Phát hành phiếu phạt + treo giò sau khi Official (idempotent theo incidentId)
  try {
    await issuePenaltiesAfterOfficialApproval(report, adminId);
  } catch (err) {
    console.error('[approveReport] issue penalties failed:', err.message);
  }

  try {
    const { notifyOfficialSettlement } = require('./official-notify.service');
    await notifyOfficialSettlement(report.raceId, report.refereeId);
  } catch (err) {
    console.error('[approveReport] notify failed:', err.message);
  }

  return populateReport(await RefereeReport.findById(reportId));
}

/** Tạo phiếu phạt / treo giò từ resolution đã lưu — chỉ gọi khi Admin duyệt Official */
async function issuePenaltiesAfterOfficialApproval(report, adminId) {
  const { createFineTicket } = require('./penalty.service');
  const { PenaltyTicket } = require('../models/penalty_ticket.model');

  for (const incident of report.incidents || []) {
    if (incident.status !== 'resolved' || !incident.resolution) continue;
    const res = incident.resolution;

    if (res.verdict === 'fine' && res.fineAmount > 0 && res.fineTargetUserId) {
      const existing = await PenaltyTicket.findOne({ incidentId: incident._id });
      if (!existing) {
        const reg = await resolveRegistrationForIncident(report, incident);
        await createFineTicket({
          userId: res.fineTargetUserId,
          raceId: report.raceId,
          reportId: report._id,
          incidentId: incident._id,
          registrationId: reg?._id || incident.registrationId || null,
          horseId: reg?.horseId || incident.horseId || null,
          amount: res.fineAmount,
          note: res.note || '',
          createdBy: adminId,
          status: 'open',
        });
      }
    }

    if (res.suspensionDays > 0) {
      const reg = await resolveRegistrationForIncident(report, incident);
      let jockeyId = reg?.jockeyId || null;
      if (res.fineTargetRole === 'jockey' && res.fineTargetUserId) {
        jockeyId = res.fineTargetUserId;
      }
      if (jockeyId) {
        await applyJockeySuspension(jockeyId, res.suspensionDays);
      }
    }
  }
}

async function rejectReport(reportId, adminId, reason) {
  const report = await RefereeReport.findById(reportId);
  if (!report) throw new AppError(404, 'Không tìm thấy báo cáo');
  migrateSubmittedStatus(report);

  if (report.status !== 'pending_approval') {
    throw new AppError(400, 'Chỉ có thể từ chối báo cáo đang chờ duyệt');
  }

  const trimmed = (reason || '').trim();
  if (!trimmed) throw new AppError(400, 'Lý do từ chối là bắt buộc');

  report.status = 'rejected';
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  report.rejectReason = trimmed;
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
    doc.text('5. Vet Checks:');
    doc.text(nilOrLines(pr.vetChecks), { width: doc.page.width - 100 });

    doc.moveDown(1);

    // ── Post-race Stewards' Report ──
    const po = report.postRaceReport || {};
    const perfLines = (po.performanceExplanations || []).map((p) => {
      const roles = (p.summonedRoles || []).join('/');
      return `${p.label}${roles ? ` [${roles}]` : ''}: ${p.explanation || '(no explanation)'}`;
    });
    const vetLines = (po.vetOrders || []).map(
      (v) => `${v.label} — ${v.orderType}${v.note ? `: ${v.note}` : ''}`,
    );

    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text("POST-RACE STEWARDS' REPORT");
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(primaryColor);
    doc.text('1. Performance Explanations:');
    doc.text(nilOrLines(perfLines), { width: doc.page.width - 100 });
    doc.moveDown(0.3);
    doc.text('2. Post-race Vet Orders:');
    doc.text(nilOrLines(vetLines), { width: doc.page.width - 100 });

    doc.moveDown(1);

    // ── Incidents ──
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
      .text(`INCIDENTS / PENALTIES (${report.incidents.length})`);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(accentColor).lineWidth(2).stroke();
    doc.moveDown(0.4);

    if (report.incidents.length === 0) {
      doc.fillColor(mutedColor).fontSize(10).text('Nil');
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

        if (incident.action) {
          doc.fillColor(mutedColor).text('Action taken:', 54, doc.y, { continued: true, width: 80 });
          doc.fillColor(primaryColor).text(' ' + incident.action);
        }

        const res = incident.resolution || {};
        if (res.verdict) {
          let penaltyLine = `Verdict: ${res.verdict}`;
          if (res.reasonCode) penaltyLine += ` / ${res.reasonCode}`;
          if (res.verdict === 'fine' && res.fineAmount != null) penaltyLine += ` / fine ${res.fineAmount}`;
          if (res.suspensionDays) penaltyLine += ` / suspend ${res.suspensionDays}d`;
          if (res.note) penaltyLine += ` — ${res.note}`;
          doc.fillColor(mutedColor).text('Penalty:', 54, doc.y, { continued: true, width: 80 });
          doc.fillColor(primaryColor).text(' ' + penaltyLine, { width: doc.page.width - 140 });
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
      .text(report.overallNotes || report.preCheckSummary || '(No notes provided)', { width: doc.page.width - 100 });

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
    {
      path: 'raceId',
      select: 'name grade scheduledTime status tournamentId distance purse isOfficial stewardsReady preRaceApproved resultsConfirmedAt resultsConfirmedBy',
    },
    { path: 'refereeId', select: 'fullName email refereeProfile' },
    { path: 'submittedBy', select: 'fullName email' },
    { path: 'reviewedBy', select: 'fullName email' },
    { path: 'preRaceReviewedBy', select: 'fullName email' },
    { path: 'incidents.horseId', select: 'name breed' },
    { path: 'complaints.submittedBy', select: 'fullName email' },
    { path: 'complaints.targetHorseId', select: 'name' },
  ]);
}

async function submitComplaint(raceId, userId, role, data) {
  const race = await Race.findById(raceId);
  if (!race) throw new AppError(404, 'Race not found');
  if (race.status === 'official') throw new AppError(400, 'Không thể khiếu nại cuộc đua đã Official');

  const report = await RefereeReport.findOne({ raceId });
  if (!report) throw new AppError(404, 'Biên bản trọng tài chưa được tạo');

  const { targetHorseId, reason } = data;
  if (!targetHorseId || !reason) throw new AppError(400, 'Thiếu thông tin khiếu nại');

  report.complaints.push({
    submittedBy: userId,
    role,
    targetHorseId,
    reason,
    status: 'pending',
  });

  await report.save();
  return report.complaints[report.complaints.length - 1];
}

async function updateComplaint(reportId, complaintId, refereeId, updateData) {
  const report = await RefereeReport.findOne({ _id: reportId, refereeId })
    .populate('complaints.submittedBy', 'fullName email');
  if (!report) throw new AppError(404, 'Biên bản không tìm thấy hoặc bạn không có quyền');

  const complaint = report.complaints.id(complaintId);
  if (!complaint) throw new AppError(404, 'Khiếu nại không tồn tại');

  const previousStatus = complaint.status;
  if (updateData.status) complaint.status = updateData.status;
  if (updateData.refereeNote !== undefined) complaint.refereeNote = updateData.refereeNote;

  // Khi referee duyệt khiếu nại -> tự động DQ ngựa bị khiếu nại và cập nhật xếp hạng
  if (updateData.status === 'approved' && previousStatus !== 'approved') {
    const { RaceResult } = require('../models/race_result.model');
    const { rebuildOfficialOrder } = require('./race-result-order.helper');

    const race = await Race.findById(report.raceId);
    if (!race) throw new AppError(404, 'Không tìm thấy cuộc đua');
    if (race.status !== 'finished') throw new AppError(400, 'Chỉ DQ sau khi cuộc đua đã finished');

    const targetHorseId = complaint.targetHorseId._id || complaint.targetHorseId;

    // Tìm kết quả của ngựa bị khiếu nại
    const result = await RaceResult.findOne({ raceId: report.raceId, horseId: targetHorseId });
    if (!result) throw new AppError(404, 'Không tìm thấy kết quả ngựa bị khiếu nại');

    // DQ ngựa
    result.disqualified = true;
    await result.save();

    // Thêm incident vào báo cáo để ghi nhận
    report.incidents.push({
      horseId: targetHorseId,
      type: 'other',
      action: `Khiếu nại từ ${complaint.submittedBy?.fullName || complaint.role} được duyệt: ${complaint.reason}`,
      source: 'manual',
      status: 'resolved',
      flaggedAt: new Date(),
      resolution: {
        verdict: 'disqualified',
        note: `Khiếu nại từ ${complaint.submittedBy?.fullName || complaint.role} — ${complaint.reason}`,
        resolvedAt: new Date(),
      },
    });

    // Rebuild xếp hạng chính thức
    await rebuildOfficialOrder(report.raceId);
  }

  await report.save();
  return populateReport(report);
}

module.exports = {
  getAssignedRaces,
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  addIncident,
  removeIncident,
  flagIncident,
  ensureDraftReport,
  updateIncident,
  resolveIncident,
  confirmResults,
  submitPreRaceReport,
  approvePreRaceReport,
  rejectPreRaceReport,
  submitReport,
  generateReportPdf,
  listReportsForAdmin,
  approveReport,
  rejectReport,
  submitComplaint,
  updateComplaint,
};
