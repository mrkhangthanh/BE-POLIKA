const { body } = require('express-validator');
const UserModel = require('../apps/models/user');

exports.createUserValidation = [
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
  body('role')
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(['admin', 'manager', 'content_writer', 'technician', 'customer', 'agent'])
    .withMessage('Invalid role.'),
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