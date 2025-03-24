const express = require('express');
const router = express.Router();
const agentController = require('../apps/Controllers/apis/agentController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// API cho đại lý
router.get('/agent/customers', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getCustomersByAgent);
router.get('/agent/orders', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getOrdersByAgentCustomers);

module.exports = router;