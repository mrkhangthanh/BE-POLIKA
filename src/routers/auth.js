const express = require('express');
const router = express.Router();
const authController = require('../apps/Controllers/apis/authController');
const authValidator = require('../validators/authValidator')
// const authMiddleware = require('../apps/middlewares/auth');
// const requireRole = require('../apps/middlewares/requireRole');
const { body } = require('express-validator');

// Đăng ký (khách hàng)
router.post('/register',authValidator.registerValidation,authController.register);

// Đăng nhập
router.post('/login',authValidator.loginValidation, authController.login);

router.post('/forgot-password',authValidator.forgotPasswordValidation,authController.forgotPassword);

// [THÊM] Route reset mật khẩu
router.post('/reset-password',authValidator.resetPasswordValidation,authController.resetPassword);

module.exports = router;