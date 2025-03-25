const { body } = require('express-validator');

exports.createPostValidation = [
    body('title')
      .notEmpty()
      .withMessage('Tiêu đề không được để trống.')
      .isLength({ max: 200 })
      .withMessage('Tiêu đề không được vượt quá 200 ký tự.'),
  
    body('content')
      .notEmpty()
      .withMessage('Nội dung không được để trống.')
      .isLength({ max: 5000 })
      .withMessage('Nội dung không được vượt quá 5000 ký tự.'),
  ];