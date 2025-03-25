const { body, query } = require('express-validator');
const UserModel = require('../apps/models/user');

exports.registerValidation = [
    // [SỬA] Không yêu cầu name
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Tên phải có ít nhất 2 ký tự.'),
  
    // [SỬA] Validate email hoặc phone_number
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Định dạng email không hợp lệ.')
      .custom(async (value) => {
        if (value) {
          const user = await UserModel.findOne({ email: value });
          if (user) {
            throw new Error('Email đã tồn tại.');
          }
        }
        return true;
      }),
  
    body('phone_number')
      .optional()
      .trim()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Số điện thoại phải có từ 10 đến 11 chữ số.')
      .custom(async (value) => {
        if (value) {
          const user = await UserModel.findOne({ phone_number: value });
          if (user) {
            throw new Error('Số điện thoại đã tồn tại.');
          }
        }
        return true;
      }),
  
    // [THÊM] Đảm bảo ít nhất một trong email hoặc phone_number được cung cấp
    body()
      .custom((value, { req }) => {
        if (!req.body.email && !req.body.phone_number) {
          throw new Error('Cần cung cấp ít nhất email hoặc số điện thoại.');
        }
        return true;
      }),
  
    body('password')
      .notEmpty()
      .withMessage('Mật khẩu không được để trống.')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự.'),
  
    // [SỬA] Không yêu cầu address
    body('address.street').optional(),
    body('address.city').optional(),
    body('address.district').optional(),
    body('address.ward').optional(),
    body('address.country').optional(),
  ];

exports.loginValidation = [
    body('identifier')
      .notEmpty()
      .withMessage('Identifier (email or phone number) is required.')
      .custom((value) => {
        // Kiểm tra xem identifier có phải là email hoặc số điện thoại hợp lệ
        const isEmail = /^\S+@\S+\.\S+$/.test(value);
        const isPhoneNumber = /^[0-9]{10,11}$/.test(value);
        if (!isEmail && !isPhoneNumber) {
          throw new Error('Identifier must be a valid email or a phone number (10-11 digits).');
        }
        return true;
      }),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
  ];

//  Validation cho quên mật khẩu
exports.forgotPasswordValidation = [
    body('identifier')
      .optional()
      .custom((value) => {
        if (!value) return true;
        const isEmail = /^\S+@\S+\.\S+$/.test(value);
        const isPhoneNumber = /^[0-9]{10,11}$/.test(value);
        if (!isEmail && !isPhoneNumber) {
          throw new Error('Identifier must be a valid email or a phone number (10-11 digits).');
        }
        return true;
      }),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format.'),
    body()
      .custom((value, { req }) => {
        if (!req.body.identifier && !req.body.email) {
          throw new Error('Either identifier or email is required.');
        }
        return true;
      }),
  ];
  
  //  Validation cho reset mật khẩu
  exports.resetPasswordValidation = [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required.'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required.')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters.'),
  ];

  //  Validation cho refresh token
exports.refreshTokenValidation = [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required.'),
  ];    

  // [THÊM] Validation cho get-status-history
exports.getStatusHistoryValidation = [
    query('userId')
      .notEmpty()
      .withMessage('User ID is required.')
      .isMongoId()
      .withMessage('Invalid user ID.'),
  ];