const { Router } = require('express');
const { z } = require('zod');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = Router();

const createRefereeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
  licenseNumber: z.string().min(1, 'License number is required'),
  yearsOfService: z.number().int().min(0).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
  role: z.enum(['owner', 'jockey', 'referee', 'spectator']),
  // referee
  licenseNumber: z.string().optional(),
  yearsOfService: z.number().int().min(0).optional(),
  // jockey
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  experienceYears: z.number().int().min(0).optional(),
  bio: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'referee' && !data.licenseNumber?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'License number is required', path: ['licenseNumber'] });
  }
  if (data.role === 'jockey') {
    if (!data.weight) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Weight is required', path: ['weight'] });
    if (!data.height) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Height is required', path: ['height'] });
  }
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  jockeyProfile: z
    .object({
      experienceYears: z.number().int().min(0).optional(),
      weight: z.number().positive().optional(),
      height: z.number().positive().optional(),
      bio: z.string().max(500).optional(),
    })
    .optional(),
  refereeProfile: z
    .object({
      licenseNumber: z.string().optional(),
      yearsOfService: z.number().int().min(0).optional(),
    })
    .optional(),
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
  askingFeePerRace: z.number().min(0).optional(),
});

const topupSchema = z.object({
  coins: z.number().int().positive(),
  returnPath: z.string().max(200).regex(/^\//).optional(),
});

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.patch('/me/availability', validate(availabilitySchema), userController.updateAvailability);
router.post('/me/upload-avatar', uploadSingle, userController.uploadAvatar);
router.get('/me/wallet', userController.getMyWallet);
router.post('/me/topup', validate(topupSchema), userController.createTopup);
router.get('/me/transactions', userController.getMyTransactions);
router.get('/me/race-results', userController.getMyRaceResults);
router.get('/me/overview', userController.getOverviewStats);
router.get('/me/monthly-stats', userController.getMonthlyStats);
router.get('/jockeys', userController.getJockeys);
router.get('/referees', userController.getReferees);
router.get('/', authorize('admin'), userController.getUsers);
router.post('/', authorize('admin'), validate(createUserSchema), userController.adminCreateUser);
router.post('/referees', authorize('admin'), validate(createRefereeSchema), userController.adminCreateReferee);
router.patch('/:id/toggle-active', authorize('admin'), userController.toggleActive);
router.patch('/:id', authorize('admin'), userController.adminUpdateUser);

module.exports = router;
