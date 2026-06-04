const { Router } = require('express');
const { z } = require('zod');
const tournamentController = require('../controllers/tournament.controller');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth.middleware');
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

// GET public — guest xem được, token optional
router.get('/', optionalAuthenticate, tournamentController.getTournaments);
router.get('/:id', optionalAuthenticate, tournamentController.getTournamentById);

// Các route còn lại bắt buộc đăng nhập
router.post('/', authenticate, authorize('admin'), validate(createTournamentSchema), tournamentController.createTournament);
router.patch('/:id', authenticate, authorize('admin'), validate(updateTournamentSchema), tournamentController.updateTournament);
router.delete('/:id', authenticate, authorize('admin'), tournamentController.deleteTournament);

module.exports = router;
