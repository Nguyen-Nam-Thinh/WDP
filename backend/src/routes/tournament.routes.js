const { Router } = require('express');
const { z } = require('zod');
const tournamentController = require('../controllers/tournament.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date' });

const createTournamentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  startDate: dateString,
  endDate: dateString,
});

const updateTournamentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  status: z.enum(['upcoming', 'ongoing', 'finished', 'cancelled']).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

router.use(authenticate);

router.post('/', authorize('admin'), validate(createTournamentSchema), tournamentController.createTournament);
router.get('/', tournamentController.getTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.patch('/:id', authorize('admin'), validate(updateTournamentSchema), tournamentController.updateTournament);
router.delete('/:id', authorize('admin'), tournamentController.deleteTournament);

module.exports = router;
