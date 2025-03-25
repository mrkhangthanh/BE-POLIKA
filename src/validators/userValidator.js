const { body } = require('express-validator');
const UserModel = require('../apps/models/user');

exports.createUserValidation = [
  body('name')
    .notEmpty()
    .withMessage('Tên không được để trống.')
    .isLength({ min: 2 })
    .withMessage('Tên phải có ít nhất 2 ký tự.'),

  body('email')
    .notEmpty()
    .withMessage('Email không được để trống.')
    .isEmail()
    .withMessage('Định dạng email không hợp lệ.')
    .custom(async (value) => {
      const user = await UserModel.findOne({ email: value });
      if (user) {
        throw new Error('Email đã tồn tại.');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống.')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự.'),

  body('phone_number')
    .notEmpty()
    .withMessage('Số điện thoại không được để trống.')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải có từ 10 đến 11 chữ số.')
    .custom(async (value) => {
      const user = await UserModel.findOne({ phone_number: value });
      if (user) {
        throw new Error('Số điện thoại đã tồn tại.');
      }
      return true;
    }),

  body('role')
    .notEmpty()
    .withMessage('Vai trò không được để trống.')
    .isIn(['admin', 'manager', 'content_writer', 'technician', 'customer', 'agent'])
    .withMessage('Vai trò không hợp lệ.'),

  body('address.street')
    .notEmpty()
    .withMessage('Địa chỉ đường không được để trống.'),

  body('address.city')
    .notEmpty()
    .withMessage('Thành phố không được để trống.'),

  body('address.district')
    .notEmpty()
    .withMessage('Quận/huyện không được để trống.'),

  body('address.ward')
    .notEmpty()
    .withMessage('Phường/xã không được để trống.'),
];