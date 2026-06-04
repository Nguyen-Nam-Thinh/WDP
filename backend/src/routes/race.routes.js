const { Router } = require('express');
const { z } = require('zod');
const raceController = require('../controllers/race.controller');
const aiPredictionController = require('../controllers/ai-prediction.controller');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date' });
const gradeEnum = z.enum(['Maiden', 'G3', 'G2', 'G1']);

const eligibilitySchema = z.object({
  allowedGrades: z.array(gradeEnum).optional(),
  minPoints: z.number().min(0).optional(),
  minAge: z.number().min(0).optional(),
  maxAge: z.number().min(0).optional(),
}).optional();

const createRaceSchema = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1).max(200),
  grade: gradeEnum,
  maxCapacity: z.number().int().min(1),
  purse: z.number().min(0),
  registrationFee: z.number().min(0),
  scheduledTime: dateString,
  cutoffTime: dateString,
  distance: z.number().min(1),
  eligibility: eligibilitySchema,
});

const updateRaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  grade: gradeEnum.optional(),
  maxCapacity: z.number().int().min(1).optional(),
  purse: z.number().min(0).optional(),
  registrationFee: z.number().min(0).optional(),
  scheduledTime: dateString.optional(),
  cutoffTime: dateString.optional(),
  distance: z.number().min(1).optional(),
  eligibility: eligibilitySchema,
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const assignRefereeSchema = z.object({
  refereeId: z.string().min(1),
});

const statusSchema = z.object({
  status: z.enum(['closed', 'pre_check']),
});

// GET public — không cần đăng nhập
router.get('/', optionalAuthenticate, raceController.getRaces);
router.get('/:id', optionalAuthenticate, raceController.getRaceById);
router.get('/:id/registrations', optionalAuthenticate, raceController.getRaceRegistrations);
router.get('/:id/horses', optionalAuthenticate, raceController.getRaceHorses);
router.get('/:id/results', optionalAuthenticate, raceController.getRaceResults);
router.get('/:id/ai-predictions', optionalAuthenticate, aiPredictionController.getRaceAIPredictions);

// Các route thay đổi dữ liệu — bắt buộc auth
router.post('/', authenticate, authorize('admin'), validate(createRaceSchema), raceController.createRace);
router.patch('/:id', authenticate, authorize('admin'), validate(updateRaceSchema), raceController.updateRace);
router.delete('/:id', authenticate, authorize('admin'), raceController.cancelRace);
router.patch('/:id/assign-referee', authenticate, authorize('admin'), validate(assignRefereeSchema), raceController.assignReferee);
router.patch('/:id/status', authenticate, authorize('admin'), validate(statusSchema), raceController.updateRaceStatus);
router.post('/:id/force-simulate', authenticate, authorize('admin'), raceController.forceSimulateRace);

module.exports = router;
