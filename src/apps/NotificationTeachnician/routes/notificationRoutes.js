const express = require('express');
const router = express.Router();
const { getUnreadNotifications, markNotificationAsRead } = require('../notificationTechnicianController/notificationController');
const authMiddleware = require('../../middlewares/auth');

router.get('/allUnread', authMiddleware, getUnreadNotifications);
router.put('/:notificationId/read', authMiddleware, markNotificationAsRead);

module.exports = router;