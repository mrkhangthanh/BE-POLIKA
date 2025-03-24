const express = require('express');
const router = express.Router();
const authController = require('../apps/Controllers/apis/authController');
const authValidattor = require('../validators/authValidator')
// const authMiddleware = require('../apps/middlewares/auth');
// const requireRole = require('../apps/middlewares/requireRole');
const { body } = require('express-validator');

// Đăng ký (khách hàng)
router.post('/register',authValidattor.registerValidation,authController.register);

// Đăng nhập
router.post('/login',authValidattor.loginValidation, authController.login);

module.exports = router;