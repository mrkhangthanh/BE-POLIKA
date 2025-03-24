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
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/agent', agentRoutes);

module.exports = router;