const notificationService = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/response');

async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page: Number(page),
      limit: Number(limit),
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    sendSuccess(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user._id);
    if (!notification) {
      sendError(res, 404, 'Notification not found');
      return;
    }
    sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user._id);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
