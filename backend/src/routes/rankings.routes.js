const { Router } = require('express');
const rankingsController = require('../controllers/rankings.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/horses', rankingsController.getHorseRankings);
router.get('/jockeys', rankingsController.getJockeyRankings);
router.get('/owners', rankingsController.getOwnerRankings);
router.get('/spectators', rankingsController.getSpectatorLeaderboard);

module.exports = router;
