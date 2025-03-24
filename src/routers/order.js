const express = require('express');
const router = express.Router();
const orderController = require('../apps/Controllers/apis/orderController');
const oderValidator = require('../validators/orderValidator');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Quản lý đơn hàng
router.post('/orders',authMiddleware,oderValidator.createOrderValidation,orderController.createOrder);
  router.get('/technician/orders', authMiddleware, orderController.getOrdersForTechnician);
  router.post('/technician/orders/:id/accept', authMiddleware, orderController.acceptOrder);
  router.post('/technician/orders/:id/reject', authMiddleware, orderController.rejectOrder);

  module.exports = router;