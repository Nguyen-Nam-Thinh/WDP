const { Router } = require('express');
const { z } = require('zod');
const horseController = require('../controllers/horse.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadMultiple } = require('../middleware/upload.middleware');

const router = Router();

const createHorseSchema = z.object({
  name: z.string().min(1).max(100),
  breed: z.string().max(100).optional(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date' }),
  weight: z.number().positive(),
  color: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
});

const updateHorseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(100).optional(),
  gender: z.enum(['male', 'female']).optional(),
  birthDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date' })
    .optional(),
  weight: z.number().positive().optional(),
  color: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
});

router.use(authenticate);

// Owner CRUD
router.post('/', authorize('owner'), validate(createHorseSchema), horseController.createHorse);
router.get('/', authorize('owner', 'admin'), horseController.getMyHorses);
router.get('/:id', authorize('owner', 'admin'), horseController.getHorseById);
router.patch('/:id', authorize('owner'), validate(updateHorseSchema), horseController.updateHorse);
router.delete('/:id', authorize('owner'), horseController.deactivateHorse);

// Regular jockeys management
router.post('/:id/regular-jockeys/:jockeyId', authorize('owner'), horseController.addRegularJockey);
router.delete(
  '/:id/regular-jockeys/:jockeyId',
  authorize('owner'),
  horseController.removeRegularJockey,
);

// Image management
router.post('/:id/upload-images', authorize('owner'), uploadMultiple, horseController.uploadImages);
router.patch('/:id/primary-image', authorize('owner'), horseController.setPrimaryImage);
router.delete('/:id/image', authorize('owner'), horseController.deleteImage);

module.exports = router;
