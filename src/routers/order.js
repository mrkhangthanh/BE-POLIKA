const express = require('express');
const router = express.Router();
const orderController = require('../apps/Controllers/apis/orderController');
const orderValidator = require('../validators/orderValidator');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const handleValidationErrors = require('../apps/middlewares/validationError')
const { body, validationResult } = require('express-validator');

// Quản lý đơn hàng
// router.post('/orders',authMiddleware,orderValidator.createOrderValidation,orderController.createOrder);
  router.get('/technician/orders', authMiddleware,requireRole(['technician']), orderController.getOrdersForTechnician);
  router.post(
    '/technician/orders/:id/accept',
    authMiddleware,
    requireRole(['technician']), // [THÊM] Chỉ technician được chấp nhận
    orderValidator.acceptOrderValidation, // [THÊM] Validation
    handleValidationErrors, // [THÊM] Xử lý lỗi validation
    orderController.acceptOrder
  );
  // Route technician từ chối đơn hàng (chỉ technician)
router.post(
  '/technician/orders/:id/reject',
  authMiddleware,
  requireRole(['technician']), // [THÊM] Chỉ technician được từ chối
  orderValidator.rejectOrderValidation, // [THÊM] Validation
  handleValidationErrors, // [THÊM] Xử lý lỗi validation
  orderController.rejectOrder
);

  router.post(
    '/create-order',
    authMiddleware,
    orderValidator.createOrderValidation,
    requireRole(['customer']),
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

// [THÊM] Route hủy đơn hàng chỉ cho khách hàng
router.post(
  '/customer/orders/:id/cancel',
  authMiddleware,
  orderValidator.cancelOrderValidation,
  handleValidationErrors,
  orderController.cancelOrder
);

// [THÊM] Route hoàn thành đơn hàng chỉ technician mới có thể sử dụng
router.post(
  '/technician/orders/:id/complete',
  authMiddleware,
  orderValidator.completeOrderValidation,
  handleValidationErrors,
  orderController.completeOrder
);

router.get(
  '/orders/:id',
  authMiddleware,
   // Thêm validation nếu cần
  handleValidationErrors,
  orderController.getOrderById
);

  module.exports = router;