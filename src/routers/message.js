const express = require('express');
const router = express.Router();
const messageController = require('../apps/Controllers/apis/messageController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Nhắn tin
router.post(
    '/messages',
    authMiddleware,
    [
      body('receiver_id').notEmpty().withMessage('Receiver ID is required'),
      body('content').notEmpty().withMessage('Message content is required'),
    ],
    messageController.sendMessage
  );
  
  router.get('/messages', authMiddleware, messageController.getMessages);

  module.exports = router;