const { Router } = require('express');
const { z } = require('zod');
const betController = require('../controllers/bet.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const placeBetSchema = z.object({
  raceId: z.string().min(1),
  horseId: z.string().min(1),
  betType: z.enum(['win', 'place', 'show']),
  amount: z.number().int().min(1),
});

router.use(authenticate);

// Admin race-scoped routes MUST come before /:id wildcard
router.get('/race/:raceId/odds', authorize('spectator', 'admin'), betController.getRaceBettingOdds);
router.get('/race/:raceId', authorize('admin'), betController.getRaceBets);
router.post('/race/:raceId/settle', authorize('admin'), betController.settleBets);

// Spectator + shared
router.post('/', authorize('spectator'), validate(placeBetSchema), betController.placeBet);
router.get('/', authorize('spectator', 'admin'), betController.getMyBets);
router.get('/:id', authorize('spectator', 'admin'), betController.getBetById);
router.delete('/:id', authorize('spectator'), betController.cancelBet);

module.exports = router;
