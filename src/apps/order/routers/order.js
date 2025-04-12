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
router.put('/orders/:id',
   authMiddleware,
   requireRole(['customer'], { readOnly: true }),
    customerValidator.updateOrderValidation,
     customerController.updateOrder
    );
router.put(
  '/orders/:id/cancel',
  authMiddleware,
  requireRole(['customer'], { readOnly: true }),
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
// Route mới: Lấy danh sách dịch vụ (service_types)
router.get('/category-service', authMiddleware, customerController.getCategoryService); 
// Route mới
router.post(
  '/category-service',
  authMiddleware,
  // [
  //   body('value').notEmpty().withMessage('Giá trị (value) là bắt buộc.'),
  //   body('label').notEmpty().withMessage('Tên danh mục (label) là bắt buộc.'),
  //   body('isActive').optional().isBoolean().withMessage('Trạng thái (isActive) phải là boolean.'),
  // ],
  customerController.createCategoryService
);

router.put(
  '/category-service/:id',
  authMiddleware,
  // [
  //   body('value').optional().notEmpty().withMessage('Giá trị (value) không được để trống.'),
  //   body('label').optional().notEmpty().withMessage('Tên danh mục (label) không được để trống.'),
  //   body('isActive').optional().isBoolean().withMessage('Trạng thái (isActive) phải là boolean.'),
  // ],
  customerController.updateCategoryService
);

router.delete('/category-service/:id', authMiddleware, customerController.deleteCategoryService);

module.exports = router;