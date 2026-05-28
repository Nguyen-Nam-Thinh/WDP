const horseService = require('../services/horse.service');
const { sendSuccess } = require('../utils/response');

async function createHorse(req, res, next) {
  try {
    const horse = await horseService.createHorse(req.user._id, req.body);
    sendSuccess(res, horse, 201, 'Horse created successfully');
  } catch (error) {
    next(error);
  }
}

async function getMyHorses(req, res, next) {
  try {
    const { page, limit, isActive, grade } = req.query;
    const result = await horseService.getMyHorses(req.user._id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      grade,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getHorseById(req, res, next) {
  try {
    const horse = await horseService.getHorseById(req.params.id, req.user._id, req.user.role);
    sendSuccess(res, horse);
  } catch (error) {
    next(error);
  }
}

async function updateHorse(req, res, next) {
  try {
    const horse = await horseService.updateHorse(req.params.id, req.user._id, req.body);
    sendSuccess(res, horse, 200, 'Horse updated successfully');
  } catch (error) {
    next(error);
  }
}

async function deactivateHorse(req, res, next) {
  try {
    const horse = await horseService.deactivateHorse(req.params.id, req.user._id);
    sendSuccess(res, horse, 200, 'Horse deactivated successfully');
  } catch (error) {
    next(error);
  }
}

async function addRegularJockey(req, res, next) {
  try {
    const horse = await horseService.addRegularJockey(req.params.id, req.user._id, req.params.jockeyId);
    sendSuccess(res, horse, 200, 'Regular jockey added');
  } catch (error) {
    next(error);
  }
}

async function removeRegularJockey(req, res, next) {
  try {
    const horse = await horseService.removeRegularJockey(req.params.id, req.user._id, req.params.jockeyId);
    sendSuccess(res, horse, 200, 'Regular jockey removed');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createHorse,
  getMyHorses,
  getHorseById,
  updateHorse,
  deactivateHorse,
  addRegularJockey,
  removeRegularJockey,
};
