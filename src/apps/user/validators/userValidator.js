const { body,param } = require('express-validator');
const UserModel = require('../../auth/models/user');

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

//   // 🔴 [SỬA] Chỉ yêu cầu address nếu role là customer hoặc technician
//   body('address.street')
//     .if(body('role').isIn(['customer', 'technician']))
//     .notEmpty()
//     .withMessage('Địa chỉ đường không được để trống cho customer hoặc technician.'),

//   body('address.city')
//     .if(body('role').isIn(['customer', 'technician']))
//     .notEmpty()
//     .withMessage('Thành phố không được để trống cho customer hoặc technician.'),

//   body('address.district')
//     .if(body('role').isIn(['customer', 'technician']))
//     .notEmpty()
//     .withMessage('Quận/huyện không được để trống cho customer hoặc technician.'),

//   body('address.ward')
//     .if(body('role').isIn(['customer', 'technician']))
//     .notEmpty()
//     .withMessage('Phường/xã không được để trống cho customer hoặc technician.'),
];
exports.updateUserValidation = [
  param('id').isMongoId().withMessage('ID người dùng không hợp lệ.'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Vui lòng cung cấp một địa chỉ email hợp lệ.'),

  body('phone_number')
    .optional()
    .isString()
    .withMessage('Số điện thoại phải là một chuỗi ký tự.'),

  body('role')
    .optional()
    .isIn(['customer', 'technician', 'admin'])
    .withMessage('Vai trò không hợp lệ.'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Trạng thái không hợp lệ.'),
];
exports.deleteUserValidation = [
  param('id').isMongoId().withMessage('ID người dùng không hợp lệ.'),
];