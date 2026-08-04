const raceService = require('../services/race.service');
const refereeService = require('../services/referee.service');
const { sendSuccess } = require('../utils/response');

async function createRace(req, res, next) {
  try {
    const race = await raceService.createRace(req.user._id, req.body);
    sendSuccess(res, race, 201, 'Race created successfully');
  } catch (error) {
    next(error);
  }
}

async function getRaces(req, res, next) {
  try {
    const { page, limit, tournamentId, grade, status, isOfficial } = req.query;
    const result = await raceService.getRaces({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      tournamentId,
      grade,
      status,
      isOfficial,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getRaceById(req, res, next) {
  try {
    const race = await raceService.getRaceById(req.params.id);
    sendSuccess(res, race);
  } catch (error) {
    next(error);
  }
}

async function updateRace(req, res, next) {
  try {
    const race = await raceService.updateRace(req.params.id, req.body);
    sendSuccess(res, race, 200, 'Race updated successfully');
  } catch (error) {
    next(error);
  }
}

async function cancelRace(req, res, next) {
  try {
    const race = await raceService.cancelRace(req.params.id);
    sendSuccess(res, race, 200, 'Race cancelled and registrations refunded');
  } catch (error) {
    next(error);
  }
}

async function assignReferee(req, res, next) {
  try {
    const race = await raceService.assignReferee(req.params.id, req.body.refereeId);
    sendSuccess(res, race, 200, 'Referee assigned successfully');
  } catch (error) {
    next(error);
  }
}

async function updateRaceStatus(req, res, next) {
  try {
    const race = await raceService.updateRaceStatus(req.params.id, req.body.status);
    sendSuccess(res, race, 200, 'Race status updated');
  } catch (error) {
    next(error);
  }
}

async function getRaceRegistrations(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await raceService.getRaceRegistrations(req.params.id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getRaceHorses(req, res, next) {
  try {
    const result = await raceService.getRaceHorses(req.params.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function forceSimulateRace(req, res, next) {
  try {
    const result = await raceService.forceSimulateRace(req.params.id);
    sendSuccess(res, result, 202, 'Simulation started');
  } catch (error) {
    next(error);
  }
}

async function getRaceResults(req, res, next) {
  try {
    const result = await raceService.getRaceResults(req.params.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getRaceBettingOdds(req, res, next) {
  try {
    const bettingOddsService = require('../services/betting-odds.service');
    const odds = await bettingOddsService.getRaceBettingOdds(req.params.id);
    sendSuccess(res, odds);
  } catch (error) {
    next(error);
  }
}

async function submitComplaint(req, res, next) {
  try {
    const complaint = await refereeService.submitComplaint(req.params.id, req.user._id, req.user.role, req.body);
    sendSuccess(res, complaint, 201, 'Complaint submitted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRace, getRaces, getRaceById, updateRace,
  cancelRace, assignReferee, updateRaceStatus, getRaceRegistrations, getRaceHorses,
  getRaceResults, forceSimulateRace, getRaceBettingOdds, submitComplaint,
};
