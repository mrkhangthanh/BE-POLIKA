const { body } = require('express-validator');

exports.sendMessageValidation = [
  body('receiver_id')
    .notEmpty()
    .withMessage('Receiver ID is required.')
    .isMongoId()
    .withMessage('Receiver ID must be a valid MongoDB ObjectId.'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required.')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters.'),
];