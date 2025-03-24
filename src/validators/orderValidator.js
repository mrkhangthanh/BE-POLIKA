const { body } = require('express-validator');

exports.createOrderValidation = [
  body('description')
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
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