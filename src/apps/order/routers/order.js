const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const technicianController = require('../controllers/technicianController');
const customerValidator = require('../validators/customerValidator');
const technicianValidator = require('../validators/technicianValidator');
const authMiddleware = require('../../middlewares/auth');
const handleValidationErrors = require('../../middlewares/validationError');
const requireRole = require('../../middlewares/requireRole');

// Routes cho khách hàng
router.post(
  '/create-order',
  authMiddleware,
  // requireRole(['customer']),
  customerValidator.createOrderValidation,
  handleValidationErrors,
  customerController.createOrder
);

router.get(
  '/customer/orders',
  authMiddleware,
  // requireRole(['customer', 'agent', 'admin', 'manager', 'technician']),
  customerValidator.getCustomerOrdersValidation,
  handleValidationErrors,
  customerController.getCustomerOrders
);

router.put(
  '/orders/:id/cancel',
  authMiddleware,
  requireRole(['customer']),
  customerController.cancelOrder
);

// Routes cho thợ sửa chữa
router.get(
  '/orders/technician',
  authMiddleware,
  requireRole(['technician']),
  technicianValidator.getOrdersForTechnicianValidation,
  handleValidationErrors,
  technicianController.getOrdersForTechnician
);

router.put(
  '/orders/:id/accept',
  authMiddleware,
  requireRole(['technician']),
  technicianValidator.acceptOrderValidation,
  handleValidationErrors,
  technicianController.acceptOrder
);

router.put(
  '/orders/:id/reject',
  authMiddleware,
  requireRole(['technician']),
  technicianValidator.rejectOrderValidation,
  handleValidationErrors,
  technicianController.rejectOrder
);

router.put(
  '/orders/:id/complete',
  authMiddleware,
  requireRole(['technician']),
  technicianValidator.completeOrderValidation,
  handleValidationErrors,
  technicianController.completeOrder
);

// Route xem chi tiết đơn hàng (dùng chung cho cả khách hàng và thợ sửa chữa)
router.get(
  '/orders/:id',
  authMiddleware,
  customerController.getOrderById
);

router.get('/category-service', authMiddleware, customerController.getCategoryService); 

module.exports = router;