const publicService = require('../services/public.service');
const { sendSuccess } = require('../utils/response');

async function getPlatformStats(req, res, next) {
  try {
    const data = await publicService.getPlatformStats();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getPlatformStats };
