const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const horseRoutes = require('./horse.routes');
const invitationRoutes = require('./jockey_invitation.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/horses', horseRoutes);
router.use('/invitations', invitationRoutes);

module.exports = router;
