const express = require('express');
const router = express.Router();
const authController = require('../apps/Controllers/apis/authController');
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
  authController.register
);

// Đăng nhập
router.post('/login', authController.login);

module.exports = router;