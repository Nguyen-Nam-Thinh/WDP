const { Notification } = require('../models/notification.model');

async function createNotification(userId, { type, title, message, data = {} }) {
  return Notification.create({ userId, type, title, message, data });
}

async function createManyNotifications(notifications) {
  if (!notifications.length) return;
  return Notification.insertMany(notifications);
}

async function getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true },
  );
}

async function markAllRead(userId) {
  return Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
}

module.exports = {
  createNotification,
  createManyNotifications,
  getUserNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
