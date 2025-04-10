const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator')
const authMiddleware = require('../../middlewares/auth');
const handleValidationErrors = require('../../middlewares/validationError')
// const requireRole = require('../apps/middlewares/requireRole');
const { body } = require('express-validator');

// Đăng ký (khách hàng)
router.post('/register',authValidator.registerValidation,handleValidationErrors,authController.register);

// Đăng nhập
router.post('/login',authValidator.loginValidation,handleValidationErrors, authController.login);

router.post('/forgot-password',authValidator.forgotPasswordValidation,handleValidationErrors,authController.forgotPassword);

// [THÊM] Route reset mật khẩu
router.post('/reset-password',authValidator.resetPasswordValidation,handleValidationErrors,authController.resetPassword);

// [THÊM] Route làm mới access token
router.post(
  '/refresh-token',authValidator.refreshTokenValidation,handleValidationErrors,
  authController.refreshToken
);

// [THÊM] Route đăng xuất
router.post(
  '/logout',
  authMiddleware, // Yêu cầu access token để xác thực user
  handleValidationErrors,authController.logout
);

// [THÊM] Route xem lịch sử trạng thái
router.get(
  '/status-history',
  authMiddleware,
  authValidator.getStatusHistoryValidation,handleValidationErrors,
  authController.getStatusHistory
);

// [THÊM] Route cập nhật hồ sơ
router.patch(
  '/update-profile',
  authMiddleware,
  authValidator.updateProfileValidation,
  handleValidationErrors,
  authController.updateProfile
);
// [THÊM] Route đăng xuất
router.post('/logout', authMiddleware, authController.logout);

// [THÊM] Route lấy thông tin người dùng
router.get('/user-info', authMiddleware, authController.getUserInfo);

module.exports = router;