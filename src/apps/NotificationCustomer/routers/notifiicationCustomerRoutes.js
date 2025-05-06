const express = require('express');
const router = express.Router();
const { getUnreadNotifications, markNotificationAsRead } = require('../notificationCustomerController/notificationCustomer');
const authMiddleware = require('../../middlewares/auth'); // Giả định bạn có middleware auth

// Lấy danh sách thông báo chưa đọc của customer
router.get('/customer/unread', authMiddleware, getUnreadNotifications);

// Đánh dấu thông báo đã đọc
router.put('/customer/:notificationId/read', authMiddleware, markNotificationAsRead);

module.exports = router;