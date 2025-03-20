const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const userController = require('../apps/Controllers/apis/user');
const authMiddleware = require('../apps/middlewares/auth');
const  requireRole = require('../apps/middlewares/requireRole');
// API for Users
router.post('/register', userController.registerUser);// đăng ký tài khoản

router.post(
  '/createUser',
  authMiddleware,
  requireRole('admin'),
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('phone_number')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Phone number must be 10-11 digits'),
    body('role')
      .optional()
      .isIn(['admin', 'customer', 'technician', 'agent'])
      .withMessage('Invalid role'),
  ],
  userController.createUser
);

router.get('/users',authMiddleware, requireRole('admin'), userController.getAllUsers);// Chỉ admin mới có thể xem danh sách user
router.get('/users/:id',authMiddleware, userController.getUserById);// Chỉ user đó hoặc admin mới có thể xem thông tin user
router.delete('/users/:id',authMiddleware, requireRole('admin'), userController.deleteUser);// Chỉ admin mới có thể xóa user

router.put('/users/:id',authMiddleware,
    [
      body('email').isEmail().withMessage('Invalid email format'),
      body('email').notEmpty().withMessage('Email is required'),
      body('role')
        .optional()
        .isIn(['admin', 'customer', 'technician', 'agent'])
        .withMessage('Invalid role'),
    ],
    userController.updateUser ); // Chỉ user đó hoặc admin mới có thể cập nhật thông tin user


// API for login (không cần auth)               
router.post('/login', userController.loginUser); // Không yêu cầu auth để user có thể đăng nhập
router.post('/reset-password', userController.resetPassword); // Không yêu cầu auth để user có thể reset mật khẩu

module.exports = router;