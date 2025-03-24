// src/routers/index.js
const express = require('express');
const router = express.Router();

// Import các route
const authRoutes = require('./auth');
const userRoutes = require('./user');
const orderRoutes = require('./order');
const postRoutes = require('./post');
const messageRoutes = require('./message');
const agentRoutes = require('./agent');

// Định nghĩa các route
router.use(authRoutes);
router.use(userRoutes);
router.use(orderRoutes);
router.use(postRoutes);
router.use(messageRoutes);
router.use(agentRoutes);

module.exports = router;