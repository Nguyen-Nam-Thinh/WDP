const { Router } = require('express');
const rankingsController = require('../controllers/rankings.controller');
const { optionalAuthenticate } = require('../middleware/auth.middleware');

const router = Router();

// Bảng xếp hạng public — không cần đăng nhập
router.get('/horses', optionalAuthenticate, rankingsController.getHorseRankings);
router.get('/jockeys', optionalAuthenticate, rankingsController.getJockeyRankings);
router.get('/owners', optionalAuthenticate, rankingsController.getOwnerRankings);
router.get('/spectators', optionalAuthenticate, rankingsController.getSpectatorLeaderboard);

module.exports = router;
