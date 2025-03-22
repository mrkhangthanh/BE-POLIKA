const express = require('express');
const router = express.Router();
const userController = require('../apps/Controllers/apis/user');
const agentController = require('../apps/Controllers/apis/agents/agentController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Đăng ký (khách hàng)
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('phone_number').matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10-11 digits'),
    body('address.street').notEmpty().withMessage('Street is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.district').notEmpty().withMessage('District is required'),
    body('address.ward').notEmpty().withMessage('Ward is required'),
  ],
  userController.register
);

// Đăng nhập
router.post('/login', userController.login);

// Quản lý user (admin và manager)
router.post(
  '/createUser',
  authMiddleware,
  requireRole(['admin'], { readOnly: false }),
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
    body('phone_number').matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10-11 digits'),
    body('role').isIn(['admin', 'manager', 'content_writer', 'technician', 'customer','agent']).withMessage('Invalid role'),
  ],
  userController.createUser 
);

router.get('/users', authMiddleware, requireRole(['admin', 'manager'], { readOnly: true }), userController.getAllUsers);
router.put('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }), userController.updateUser );
router.delete('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }), userController.deleteUser );

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
  userController.createOrder
);

router.get('/technician/orders', authMiddleware, userController.getOrdersForTechnician);
router.post('/technician/orders/:id/accept', authMiddleware, userController.acceptOrder);
router.post('/technician/orders/:id/reject', authMiddleware, userController.rejectOrder);

// Quản lý bài viết
router.post(
  '/posts',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  userController.createPost
);

router.get('/posts/:id', authMiddleware, userController.getPostById);

router.get('/posts', authMiddleware, userController.getPosts);
router.put('/posts/:id', authMiddleware, userController.updatePost);
router.delete('/posts/:id', authMiddleware, userController.deletePost);

// Nhắn tin
router.post(
  '/messages',
  authMiddleware,
  [
    body('receiver_id').notEmpty().withMessage('Receiver ID is required'),
    body('content').notEmpty().withMessage('Message content is required'),
  ],
  userController.sendMessage
);

router.get('/messages', authMiddleware, userController.getMessages);

// API cho đại lý
router.get('/agent/customers', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getCustomersByAgent);
router.get('/agent/orders', authMiddleware, requireRole(['agent'], { readOnly: true }), agentController.getOrdersByAgentCustomers);

module.exports = router;