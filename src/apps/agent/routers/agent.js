const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../../middlewares/auth');
const agentValidator = require('../validators/getCommissionValidation');
const requireRole = require('../../middlewares/requireRole');
const { body, validationResult } = require('express-validator');
const handleValidationErrors = require('../../middlewares/validationError');
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