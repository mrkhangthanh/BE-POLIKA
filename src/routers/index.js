// src/routers/index.js
const express = require('express');
const router = express.Router();

// Import các route
const authRoutes = require('../apps/auth/routers/auth');
const userRoutes = require('../apps/user/routers/user');
const orderRoutes = require('../apps/order/routers/order');
const postRoutes = require('../apps/post/routers/post');
const messageRoutes = require('../apps/message/routers/message');
const agentRoutes = require('../apps/agent/routers/agent');
const statsRoutes = require('../apps/stats/routers/stats');

// Định nghĩa các route
router.use(authRoutes);
router.use(userRoutes);
router.use(orderRoutes);
router.use(postRoutes);
router.use(messageRoutes);
router.use(agentRoutes);
router.use(statsRoutes);

module.exports = router;