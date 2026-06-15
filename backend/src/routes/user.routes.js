const { Router } = require('express');
const { z } = require('zod');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = Router();

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

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.post('/me/upload-avatar', uploadSingle, userController.uploadAvatar);
router.get('/me/wallet', userController.getMyWallet);
router.get('/me/transactions', userController.getMyTransactions);
router.get('/me/race-results', userController.getMyRaceResults);
router.get('/me/overview', userController.getOverviewStats);
router.get('/me/monthly-stats', userController.getMonthlyStats);
router.get('/jockeys', userController.getJockeys);
router.get('/referees', userController.getReferees);
router.get('/', userController.getUsers);
router.patch('/:id/toggle-active', userController.toggleActive);
router.patch('/:id', userController.adminUpdateUser);

module.exports = router;
