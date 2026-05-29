const registrationService = require('../services/registration.service');
const { sendSuccess } = require('../utils/response');

async function registerHorse(req, res, next) {
  try {
    const registration = await registrationService.registerHorse(req.user._id, req.body);
    sendSuccess(res, registration, 201, 'Horse registered successfully');
  } catch (error) {
    next(error);
  }
}

async function getRegistrations(req, res, next) {
  try {
    const { page, limit, raceId, status } = req.query;
    const result = await registrationService.getRegistrations(req.user._id, req.user.role, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      raceId,
      status,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getRegistrationById(req, res, next) {
  try {
    const registration = await registrationService.getRegistrationById(
      req.params.id, req.user._id, req.user.role,
    );
    sendSuccess(res, registration);
  } catch (error) {
    next(error);
  }
}

async function assignJockey(req, res, next) {
  try {
    const registration = await registrationService.assignJockey(
      req.params.id, req.user._id, req.body.jockeyId,
    );
    sendSuccess(res, registration, 200, 'Jockey assigned successfully');
  } catch (error) {
    next(error);
  }
}

async function cancelRegistration(req, res, next) {
  try {
    const registration = await registrationService.cancelRegistration(req.params.id, req.user._id);
    sendSuccess(res, registration, 200, 'Registration cancelled with 40% refund');
  } catch (error) {
    next(error);
  }
}

async function updatePreCheck(req, res, next) {
  try {
    const registration = await registrationService.updatePreCheck(
      req.params.id, req.user._id, req.body,
    );
    sendSuccess(res, registration, 200, 'Pre-check result updated');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerHorse, getRegistrations, getRegistrationById,
  assignJockey, cancelRegistration, updatePreCheck,
};
