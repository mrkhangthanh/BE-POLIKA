const express = require('express');
const router = express.Router();
const authController = require('../apps/Controllers/apis/authController');
const userController = require('../apps/Controllers/apis/userController');
const orderController = require('../apps/Controllers/apis/orderController');
const postController = require('../apps/Controllers/apis/postController');
const messageController = require('../apps/Controllers/apis/messageController');
const agentController = require('../apps/Controllers/apis/agentController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// API cho đại lý
router.get('/agent/customers', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getCustomersByAgent);
router.get('/agent/orders', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getOrdersByAgentCustomers);

module.exports = router;