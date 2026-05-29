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
