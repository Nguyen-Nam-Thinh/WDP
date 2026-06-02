const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const horseRoutes = require('./horse.routes');
const invitationRoutes = require('./jockey_invitation.routes');
const tournamentRoutes = require('./tournament.routes');
const raceRoutes = require('./race.routes');
const registrationRoutes = require('./registration.routes');
const refereeRoutes = require('./referee.routes');
const betRoutes = require('./bet.routes');
const rankingsRoutes = require('./rankings.routes');
const publicRoutes = require('./public.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/horses', horseRoutes);
router.use('/invitations', invitationRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/races', raceRoutes);
router.use('/registrations', registrationRoutes);
router.use('/referee', refereeRoutes);
router.use('/bets', betRoutes);
router.use('/rankings', rankingsRoutes);
router.use('/public', publicRoutes);

module.exports = router;
