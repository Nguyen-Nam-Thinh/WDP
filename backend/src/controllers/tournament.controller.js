const tournamentService = require('../services/tournament.service');
const { sendSuccess } = require('../utils/response');

async function createTournament(req, res, next) {
  try {
    const tournament = await tournamentService.createTournament(req.user._id, req.body);
    sendSuccess(res, tournament, 201, 'Tournament created successfully');
  } catch (error) {
    next(error);
  }
}

async function getTournaments(req, res, next) {
  try {
    const { page, limit, status, isActive } = req.query;
    const result = await tournamentService.getTournaments({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getTournamentById(req, res, next) {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id);
    sendSuccess(res, tournament);
  } catch (error) {
    next(error);
  }
}

async function updateTournament(req, res, next) {
  try {
    const tournament = await tournamentService.updateTournament(req.params.id, req.body);
    sendSuccess(res, tournament, 200, 'Tournament updated successfully');
  } catch (error) {
    next(error);
  }
}

async function deleteTournament(req, res, next) {
  try {
    const tournament = await tournamentService.deleteTournament(req.params.id);
    sendSuccess(res, tournament, 200, 'Tournament deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament };
