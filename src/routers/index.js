// src/routers/index.js
const express = require('express');
const router = express.Router();

// Import các route
const authRoutes = require('../apps/auth/routers/auth');
const userRoutes = require('../apps/user/routers/user');
const orderRoutes = require('../apps/order/routers/order');
const postRoutes = require('../apps/post/routers/post');

const agentRoutes = require('../apps/agent/routers/agent');
const statsRoutes = require('../apps/stats/routers/stats');
const fcmRoutes = require('../apps/fcmToken/routers/fcm');
const categoryServiceRoutes = require('../apps/categoryService/routers/categoryServices');
const notificationTechnicianRoutes = require('../apps/NotificationTeachnician/routes/notificationRoutes'); // Đường dẫn đến file notificationTechnicianRoutes.js
const notificationCustomerRoutes = require('../apps/NotificationCustomer/routers/notifiicationCustomerRoutes'); // Đường dẫn đến file nnotificationCustomerRoutes.js
const conversationsMessagesRoutes = require('../apps/conversationsMessages/routers/conversationsMessages'); // Đường dẫn đến file conversationsMessagesRoutes.js
const adminConversationsMessagesRoutes = require('../apps/conversationsMessages/routers/adminConversationsMessages'); // Đường dẫn đến file adminConversationsMessagesRoutes.js
const userAdminRoutes = require('../apps/userAdmin/routers/userAdminRt'); // Đường dẫn đến file userAdminRoutes.js
const supportConversationRoutes = require('../apps/SupportConversation/routers/conversationRoutes'); // Đường dẫn đến file supportConversationRoutes.js

// Định nghĩa các route
router.use(authRoutes);
router.use(userRoutes);
router.use(orderRoutes);
router.use(postRoutes);
router.use(agentRoutes);
router.use(statsRoutes);
router.use(fcmRoutes);
router.use(categoryServiceRoutes);
router.use(notificationTechnicianRoutes); // Sử dụng route cho thông báo technician ở đây
router.use(notificationCustomerRoutes); // Sử dụng route cho thông báo customer ở đây
router.use(conversationsMessagesRoutes); // Sử dụng route cho converstation ở đây
router.use(adminConversationsMessagesRoutes); // Sử dụng route cho admin conversation ở đây
router.use(userAdminRoutes); // Sử dụng route cho user admin ở đây
router.use(supportConversationRoutes); // Sử dụng route cho support conversation ở đây

module.exports = router;