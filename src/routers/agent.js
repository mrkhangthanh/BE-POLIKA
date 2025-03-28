const express = require('express');
const router = express.Router();
const agentController = require('../apps/Controllers/apis/agentController');
const authMiddleware = require('../apps/middlewares/auth');
const agentValidator = require('../validators/orderValidator');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');
const handleValidationErrors = require('../apps/middlewares/validationError');
// API cho đại lý
router.get('/agent/customers', authMiddleware, requireRole(['agent'], { readOnly: true }),handleValidationErrors, agentController.getCustomersByAgent);
router.get('/agent/orders', authMiddleware, requireRole(['agent'], { readOnly: true }),handleValidationErrors, agentController.getOrdersByAgentCustomers);
// Thêm route GET /agent/commission
router.get(
    '/agent/commission',
    authMiddleware,
    requireRole(['agent']),
    agentValidator.getCommissionValidation,
    handleValidationErrors,
    agentController.getCommission
  );

module.exports = router;