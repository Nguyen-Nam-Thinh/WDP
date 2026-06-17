const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notification.controller');

const router = Router();

router.use(authenticate);

router.get('/',               getNotifications);
router.get('/unread-count',   getUnreadCount);
router.patch('/read-all',     markAllRead);
router.patch('/:id/read',     markRead);

module.exports = router;
