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
