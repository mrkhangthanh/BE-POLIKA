const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const supportCreateSupportConversation  = require('../supportController/supportConversationController');
const requireRole = require('../../middlewares/requireRole');

router.post('/support-conversation',
  authMiddleware,
  requireRole(['technician', 'customer', 'manager', 'admin']),

  supportCreateSupportConversation.createSupportConversation);

module.exports = router;