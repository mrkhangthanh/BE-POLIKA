const express = require('express');
const router = express.Router();
const requireRole = require('../../middlewares/requireRole');
const authMiddleware = require('../../middlewares/auth');
const admimConversationsController = require('../adminconversationsController/adminConversations');
const adminconversationsIdController = require('../adminconversationsController/adminConversationsId');
const adminDeleteConversationIdController = require('../adminconversationsController/adminDeleteConversationId');
const SearchConversationsController = require('../adminconversationsController/searchConversations');
const adminConversationsIdMessagesController = require('../adminconversationsController/adminConversationsIdMessages');
const adminDeleteMessagesInRangeController = require('../adminconversationsController/deleteMessagesInRange');
const adminSupportConversationController = require('../adminconversationsController/adminSupportConversation');


// GET /admin/conversations/search - Tìm kiếm hội thoại
router.get(
  '/admin/conversations/search',
  authMiddleware,
  requireRole(['admin', 'manager', 'agent', 'technician'], { readOnly: true }),
  SearchConversationsController.searchAdminConversations
);

// GET /admin/conversations - Lấy danh sách hội thoại
router.get(
  '/admin/conversations',
  authMiddleware,
  requireRole(['admin', 'manager', 'agent', 'technician'], { readOnly: true }),
  admimConversationsController.getAllConversations
);

// GET /admin/conversations/:conversationId - Lấy chi tiết hội thoại
router.get(
  '/admin/conversations/:conversationId',
  authMiddleware,
  requireRole(['admin', 'manager', 'agent', 'technician'], { readOnly: true }),
  adminconversationsIdController.getConversationById
);

// POST /admin/conversations/:conversationId/messages - Gửi tin nhắn mới
router.post(
  '/admin/conversations/:conversationId/messages',
  authMiddleware,
  requireRole(['admin', 'manager', 'agent', 'technician'], { readOnly: false }),
  adminConversationsIdMessagesController.sendMessage
);

// DELETE /admin/conversations/:conversationId - Xóa hội thoại
router.delete(
  '/admin/conversations/:conversationId',
  authMiddleware,
  requireRole(['admin', 'manager'], { readOnly: false }),
  adminDeleteConversationIdController.deleteConversation
);
// DELETE /admin/conversations/:conversationId - Xóa hội thoại trong khoảng thời gian
router.delete(
  '/admin/conversations/:conversationId/messages',
  authMiddleware,
  requireRole(['admin', 'manager'], { readOnly: false }),
  adminDeleteMessagesInRangeController.deleteMessagesInRange
);


// DELETE /admin/messages - Xóa nội dung tin nhắn của tất cả hội thoại giữa customer và technician
router.delete(
  '/admin/messages',
  authMiddleware,
  requireRole(['admin', 'manager'], { readOnly: false }),
  adminDeleteMessagesInRangeController.deleteAllMessagesInRange
);

// GET /admin/conversations/search - Tìm kiếm hội thoại
// router.get(
//   '/admin/conversations/search',
//   authMiddleware,
//   requireRole(['admin', 'manager', 'agent', 'technician'], { readOnly: true }),
//   adminSearchConversationsController.searchAdminConversations
// );

// GET /admin/support/conversation - Lấy hoặc tạo hội thoại hỗ trợ cho admin/manager
router.get(
  '/admin/support/conversation',
  authMiddleware,
  adminSupportConversationController.getSupportConversation
);


module.exports = router;