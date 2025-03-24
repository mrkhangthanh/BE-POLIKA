const { body } = require('express-validator');
const UserModel = require('../apps/models/user');

exports.registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters.'),
  body('email')
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email format.')
    .custom(async (value) => {
      const user = await UserModel.findOne({ email: value });
      if (user) {
        throw new Error('Email already exists.');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required.')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone number must be 10-11 digits.')
    .custom(async (value) => {
      const user = await UserModel.findOne({ phone_number: value });
      if (user) {
        throw new Error('Phone number already exists.');
      }
      return true;
    }),
  body('address.street')
    .notEmpty()
    .withMessage('Street is required.'),
  body('address.city')
    .notEmpty()
    .withMessage('City is required.'),
  body('address.district')
    .notEmpty()
    .withMessage('District is required.'),
  body('address.ward')
    .notEmpty()
    .withMessage('Ward is required.'),
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

// [THÊM] Validation cho quên mật khẩu
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
  
  // [THÊM] Validation cho reset mật khẩu
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