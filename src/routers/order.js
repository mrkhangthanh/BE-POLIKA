const express = require('express');
const router = express.Router();
const orderController = require('../apps/Controllers/apis/orderController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Quản lý đơn hàng
router.post(
    '/orders',
    authMiddleware,
    [
      body('service_type').notEmpty().withMessage('Service type is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('address.street').notEmpty().withMessage('Street is required'),
      body('address.city').notEmpty().withMessage('City is required'),
      body('address.district').notEmpty().withMessage('District is required'),
      body('address.ward').notEmpty().withMessage('Ward is required'),
    ],
    orderController.createOrder
  );
  
  router.get('/technician/orders', authMiddleware, orderController.getOrdersForTechnician);
  router.post('/technician/orders/:id/accept', authMiddleware, orderController.acceptOrder);
  router.post('/technician/orders/:id/reject', authMiddleware, orderController.rejectOrder);

  module.exports = router;