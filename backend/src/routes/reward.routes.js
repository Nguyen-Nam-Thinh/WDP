const { Router } = require('express');
const { z } = require('zod');
const rewardController = require('../controllers/reward.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = Router();

const createRewardSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  description: z.string().min(1, 'Mô tả không được để trống'),
  coinsRequired: z.number().int().min(0, 'Coins yêu cầu phải lớn hơn hoặc bằng 0'),
  imageUrl: z.string().url('Đường dẫn ảnh không hợp lệ').optional().or(z.literal('')),
  stock: z.number().int().min(0, 'Số lượng tồn kho phải lớn hơn hoặc bằng 0').default(10),
  isActive: z.boolean().default(true),
  type: z.enum(['voucher', 'physical']).default('voucher'),
});

const updateRewardSchema = createRewardSchema.partial();

router.use(authenticate);

// Admin Reward routes
router.get('/admin', authorize('admin'), rewardController.getAdminRewards);
router.get('/admin/redemptions', authorize('admin'), rewardController.getAllRedemptions);
router.post('/admin/upload-image', authorize('admin'), uploadSingle, rewardController.uploadRewardImage);
router.post('/admin', authorize('admin'), validate(createRewardSchema), rewardController.createReward);
router.patch('/admin/:id', authorize('admin'), validate(updateRewardSchema), rewardController.updateReward);
router.delete('/admin/:id', authorize('admin'), rewardController.deleteReward);

// Player/Guest Reward routes
router.get('/', rewardController.getRewards);
router.post('/:id/redeem', rewardController.redeemReward);
router.get('/my-redemptions', rewardController.getMyRedemptions);

module.exports = router;
