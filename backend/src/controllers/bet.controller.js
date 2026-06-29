const betService = require('../services/bet.service');
const { sendSuccess } = require('../utils/response');

async function placeBet(req, res, next) {
  try {
    const bet = await betService.placeBet(req.user._id, req.body);
    sendSuccess(res, bet, 201, 'Bet placed successfully');
  } catch (err) {
    next(err);
  }
}

async function getMyBets(req, res, next) {
  try {
    const { page, limit, status, raceId } = req.query;
    const result = await betService.getMyBets(req.user._id, req.user.role, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      raceId,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getBetById(req, res, next) {
  try {
    const bet = await betService.getBetById(req.params.id, req.user._id, req.user.role);
    sendSuccess(res, bet);
  } catch (err) {
    next(err);
  }
}

async function cancelBet(req, res, next) {
  try {
    const bet = await betService.cancelBet(req.params.id, req.user._id);
    sendSuccess(res, bet, 200, 'Bet cancelled with full refund');
  } catch (err) {
    next(err);
  }
}

async function getRaceBets(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await betService.getRaceBets(req.params.raceId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function settleBets(req, res, next) {
  try {
    const result = await betService.settleBets(req.params.raceId);
    sendSuccess(res, result, 200, 'Bets settled successfully');
  } catch (err) {
    next(err);
  }
}

async function getRaceBettingOdds(req, res, next) {
  try {
    const odds = await betService.getRaceBettingOdds(req.params.raceId);
    sendSuccess(res, odds);
  } catch (err) {
    next(err);
  }
}

module.exports = { placeBet, getMyBets, getBetById, cancelBet, getRaceBets, settleBets, getRaceBettingOdds };
