const { Router } = require('express');
const { z } = require('zod');
const refereeController = require('../controllers/referee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  PRE_RACE_TRACK_CONDITIONS,
  PENALTY_REASON_CODES,
  POST_RACE_VET_ORDER_TYPES,
} = require('../config/constants');

const asEnum = (arr) => z.enum(/** @type {[string, ...string[]]} */ (arr));

const router = Router();

// Referee only (except GET report by id which also allows admin)
router.use(authenticate);

// ── UC-R2: Assigned races ─────────────────────────────────────────────────────
router.get('/races', authorize('referee'), refereeController.getAssignedRaces);

// ── UC-R7: Referee reports ────────────────────────────────────────────────────
const createReportSchema = z.object({
  raceId: z.string().min(1),
});

const trackEnum = asEnum(PRE_RACE_TRACK_CONDITIONS);

const performanceExplanationSchema = z.object({
  registrationId: z.string().min(1),
  horseId: z.string().min(1),
  label: z.string().min(1).max(300),
  summonedRoles: z.array(z.enum(['jockey', 'owner'])).max(2).optional(),
  explanation: z.string().max(2000).optional(),
  recordedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

const vetOrderSchema = z.object({
  registrationId: z.string().min(1),
  horseId: z.string().min(1),
  label: z.string().min(1).max(300),
  orderType: asEnum(POST_RACE_VET_ORDER_TYPES),
  note: z.string().max(1000).optional(),
  orderedAt: z.union([z.string(), z.coerce.date()]).optional(),
});

const updateReportSchema = z.object({
  overallNotes: z.string().max(2000).optional(),
  preRaceReport: z.object({
    trackCondition: z.union([trackEnum, z.literal('')]).optional(),
    trackConditionNote: z.string().max(500).optional(),
    riderChanges: z.array(z.string().max(300)).max(50).optional(),
    gearChanges: z.array(z.string().max(300)).max(50).optional(),
    vetChecks: z.array(z.string().max(300)).max(50).optional(),
  }).optional(),
  postRaceReport: z.object({
    performanceExplanations: z.array(performanceExplanationSchema).max(50).optional(),
    vetOrders: z.array(vetOrderSchema).max(50).optional(),
  }).optional(),
}).refine(
  (d) => d.overallNotes !== undefined || d.preRaceReport !== undefined || d.postRaceReport !== undefined,
  { message: 'At least one field required' },
);

const incidentSchema = z.object({
  registrationId: z.string().min(1).optional(),
  type: z.enum(['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other']),
  action: z.string().max(500).optional(),
});

const flagSchema = z.object({
  registrationId: z.string().min(1).optional(),
  horseId: z.string().min(1).optional(),
  raceTimeMs: z.number().nonnegative().optional(),
}).refine((d) => d.registrationId || d.horseId, { message: 'registrationId or horseId required' });

const ensureReportSchema = z.object({
  raceId: z.string().min(1),
});

const rejectReportSchema = z.object({
  reason: z.string().min(1).max(1000),
});

const updateIncidentSchema = z.object({
  type: z.enum(['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other']).optional(),
  action: z.string().max(500).optional(),
}).refine(
  (d) => d.type !== undefined || d.action !== undefined,
  { message: 'At least one field required' },
);

const resolveIncidentSchema = z.object({
  type: z.enum(['interference', 'doping', 'equipment_violation', 'jockey_violation', 'other']).optional(),
  action: z.string().max(500).optional(),
  resolution: z.object({
    verdict: z.enum(['none', 'warning', 'fine', 'disqualified']),
    fineAmount: z.number().positive().optional(),
    fineTargetRole: z.enum(['owner', 'jockey']).optional(),
    reasonCode: asEnum(PENALTY_REASON_CODES).nullable().optional(),
    suspensionDays: z.number().int().min(0).max(365).nullable().optional(),
    note: z.string().max(1000).optional(),
  }),
}).superRefine((data, ctx) => {
  if (data.resolution.verdict === 'fine') {
    if (data.resolution.fineAmount == null || data.resolution.fineAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fineAmount required and must be > 0 when verdict is fine',
        path: ['resolution', 'fineAmount'],
      });
    }
    if (!data.resolution.fineTargetRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fineTargetRole (owner|jockey) required when verdict is fine',
        path: ['resolution', 'fineTargetRole'],
      });
    }
  }
});

router.post('/reports', authorize('referee'), validate(createReportSchema), refereeController.createReport);
router.post('/reports/ensure', authorize('referee'), validate(ensureReportSchema), refereeController.ensureDraftReport);
router.get('/reports', authorize('referee'), refereeController.getMyReports);
router.get('/reports/:id', authorize('referee', 'admin'), refereeController.getReportById);
router.patch('/reports/:id', authorize('referee'), validate(updateReportSchema), refereeController.updateReport);
router.post('/reports/:id/submit-prerace', authorize('referee'), refereeController.submitPreRaceReport);
router.post('/reports/:id/submit', authorize('referee'), refereeController.submitReport);
router.get('/reports/:id/pdf', authorize('referee', 'admin'), refereeController.downloadReportPdf);
router.patch('/reports/:id/complaints/:complaintId', authorize('referee'), refereeController.updateComplaint);

// Admin review
router.get('/admin/reports', authorize('admin'), refereeController.listReportsAdmin);
router.post('/admin/reports/:id/approve-prerace', authorize('admin'), refereeController.approvePreRaceReport);
router.post('/admin/reports/:id/reject-prerace', authorize('admin'), validate(rejectReportSchema), refereeController.rejectPreRaceReport);
router.post('/admin/reports/:id/approve', authorize('admin'), refereeController.approveReport);
router.post('/admin/reports/:id/reject', authorize('admin'), validate(rejectReportSchema), refereeController.rejectReport);

// Incidents
router.post('/reports/:id/incidents', authorize('referee'), validate(incidentSchema), refereeController.addIncident);
router.post('/reports/:id/incidents/flag', authorize('referee'), validate(flagSchema), refereeController.flagIncident);
router.patch(
  '/reports/:id/incidents/:incidentId',
  authorize('referee'),
  validate(updateIncidentSchema),
  refereeController.updateIncident,
);
router.patch(
  '/reports/:id/incidents/:incidentId/resolve',
  authorize('referee'),
  validate(resolveIncidentSchema),
  refereeController.resolveIncident,
);
router.delete('/reports/:id/incidents/:incidentId', authorize('referee'), refereeController.removeIncident);

// UC-R6 confirm results
router.post('/races/:raceId/confirm-results', authorize('referee'), refereeController.confirmResults);

module.exports = router;
