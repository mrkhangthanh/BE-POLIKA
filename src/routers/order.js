const express = require('express');
const router = express.Router();
const orderController = require('../apps/Controllers/apis/orderController');
const orderValidator = require('../validators/orderValidator');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const handleValidationErrors = require('../apps/middlewares/validationError')
const { body, validationResult } = require('express-validator');

// Quản lý đơn hàng
router.post('/orders',authMiddleware,orderValidator.createOrderValidation,orderController.createOrder);
  router.get('/technician/orders', authMiddleware, orderController.getOrdersForTechnician);
  router.post('/technician/orders/:id/accept', authMiddleware, orderController.acceptOrder);
  router.post('/technician/orders/:id/reject', authMiddleware, orderController.rejectOrder);

  router.post(
    '/create-order',
    authMiddleware,
    orderValidator.createOrderValidation,
    handleValidationErrors,
    orderController.createOrder
  );
// [THÊM] Route xem danh sách đơn hàng của khách hàng
router.get(
  '/customer/orders',
  authMiddleware,
  orderValidator.getCustomerOrdersValidation,
  handleValidationErrors,
  orderController.getCustomerOrders
);

  module.exports = router;