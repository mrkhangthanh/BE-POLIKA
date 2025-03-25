const { body } = require('express-validator');

exports.createOrderValidation = [
    body('description')
      .notEmpty()
      .withMessage('Mô tả không được để trống.')
      .isLength({ max: 1000 })
      .withMessage('Mô tả không được vượt quá 1000 ký tự.'),
  
    body('address.street')
      .notEmpty()
      .withMessage('Địa chỉ đường không được để trống.'),
  
    body('address.city')
      .notEmpty()
      .withMessage('Thành phố không được để trống.'),
  
    body('address.district')
      .notEmpty()
      .withMessage('Quận/Huyện không được để trống.'),
  
    body('address.ward')
      .notEmpty()
      .withMessage('Phường/Xã không được để trống.'),
  ];