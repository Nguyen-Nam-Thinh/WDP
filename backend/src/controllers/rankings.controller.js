const rankingsService = require('../services/rankings.service');
const { sendSuccess } = require('../utils/response');

async function getHorseRankings(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await rankingsService.getHorseRankings({ limit });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function getJockeyRankings(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await rankingsService.getJockeyRankings({ limit });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function getOwnerRankings(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await rankingsService.getOwnerRankings({ limit });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function getSpectatorLeaderboard(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await rankingsService.getSpectatorLeaderboard({ limit });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getHorseRankings, getJockeyRankings, getOwnerRankings, getSpectatorLeaderboard };
