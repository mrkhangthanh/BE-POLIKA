const { body } = require('express-validator');

exports.createPostValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters.'),
  body('content')
    .notEmpty()
    .withMessage('Content is required.')
    .isLength({ max: 5000 })
    .withMessage('Content cannot exceed 5000 characters.'),
];