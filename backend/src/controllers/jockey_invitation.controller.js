const invitationService = require('../services/jockey_invitation.service');
const { sendSuccess } = require('../utils/response');

async function createInvitation(req, res, next) {
  try {
    const invitation = await invitationService.createInvitation(req.user._id, req.body);
    sendSuccess(res, invitation, 201, 'Invitation sent successfully');
  } catch (error) {
    next(error);
  }
}

async function getInvitations(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await invitationService.getInvitations(req.user._id, req.user.role, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function getInvitationById(req, res, next) {
  try {
    const invitation = await invitationService.getInvitationById(req.params.id, req.user._id, req.user.role);
    sendSuccess(res, invitation);
  } catch (error) {
    next(error);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const invitation = await invitationService.acceptInvitation(req.params.id, req.user._id);
    sendSuccess(res, invitation, 200, 'Invitation accepted');
  } catch (error) {
    next(error);
  }
}

async function rejectInvitation(req, res, next) {
  try {
    const invitation = await invitationService.rejectInvitation(req.params.id, req.user._id, req.body.rejectionNote);
    sendSuccess(res, invitation, 200, 'Invitation rejected');
  } catch (error) {
    next(error);
  }
}

async function cancelInvitation(req, res, next) {
  try {
    const invitation = await invitationService.cancelInvitation(req.params.id, req.user._id);
    sendSuccess(res, invitation, 200, 'Invitation cancelled');
  } catch (error) {
    next(error);
  }
}

async function getForumJockeys(req, res, next) {
  try {
    const { page, limit, style } = req.query;
    const result = await invitationService.getAvailableJockeys({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      style,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInvitation,
  getInvitations,
  getInvitationById,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  getForumJockeys,
};
