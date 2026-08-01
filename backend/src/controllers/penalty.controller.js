const penaltyService = require('../services/penalty.service');
const { sendSuccess } = require('../utils/response');

async function listMine(req, res, next) {
  try {
    const tickets = await penaltyService.listMyPenalties(req.user._id, {
      status: req.query.status,
    });
    sendSuccess(res, { tickets });
  } catch (error) {
    next(error);
  }
}

async function pay(req, res, next) {
  try {
    const ticket = await penaltyService.payPenalty(req.params.id, req.user._id);
    sendSuccess(res, ticket, 200, 'Đã nộp phạt');
  } catch (error) {
    next(error);
  }
}

module.exports = { listMine, pay };
