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
      ['Purse', `${race.purse.toLocaleString('vi-VN')} VNĐ`],
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
