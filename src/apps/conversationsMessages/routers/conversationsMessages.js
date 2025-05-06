const express = require('express');
const router = express.Router();
const conversationController = require('../conversationsMessagesController/conversations');
const converstationsIdController = require('../conversationsMessagesController/conversationsId');
const conversationsIdMessagesController = require('../conversationsMessagesController/conversationsIdMessages');
const messagesIdReactionController = require('../conversationsMessagesController/messagesIdReaction');
const conversationsIdReadController = require('../conversationsMessagesController/conversationsIdRead');

const authMiddleware = require('../../middlewares/auth');

// const requireRole = require('../apps/middlewares/requireRole');
const { body } = require('express-validator');


// [THÊM] Route cập nhật hồ sơ
router.get(
  '/conversations',
  authMiddleware,
  conversationController.getConversations,
);
router.get(
  '/conversations/:conversationId',
  authMiddleware,
  converstationsIdController.getConversation,
);
router.post(
  '/conversations/:conversationId/messages',
  authMiddleware,
  conversationsIdMessagesController.sendMessage,
);
router.patch(
  '/messages/:messageId/reaction',
  authMiddleware,
  messagesIdReactionController.updateReaction,
);
router.patch(
  '/conversations/:conversationId/read',
  authMiddleware,
  conversationsIdReadController.markAsRead,
);

module.exports = router;