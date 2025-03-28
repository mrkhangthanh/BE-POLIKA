const { body } = require('express-validator');

exports.sendMessageValidation = [
    body('receiver_id')
      .notEmpty()
      .withMessage('ID người nhận không được để trống.')
      .isMongoId()
      .withMessage('ID người nhận phải là một MongoDB ObjectId hợp lệ.'),
  
    body('content')
      .notEmpty()
      .withMessage('Nội dung tin nhắn không được để trống.')
      .isLength({ max: 1000 })
      .withMessage('Nội dung tin nhắn không được vượt quá 1000 ký tự.'),
  ];