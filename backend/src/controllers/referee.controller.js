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
