const { body, query, param } = require('express-validator');
const { TECHNICIAN_SORT_FIELDS, VALID_SORT_ORDERS } = require('../../Shared/constants/sortFields');

exports.getOrdersForTechnicianValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là một số nguyên dương.'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 100.'),
  
  query('sortBy')
    .optional()
    .isIn(TECHNICIAN_SORT_FIELDS)
    .withMessage(`Sắp xếp theo phải là một trong: ${TECHNICIAN_SORT_FIELDS.join(', ')}`),
  
  query('sortOrder')
    .optional()
    .isIn(VALID_SORT_ORDERS)
    .withMessage('Thứ tự sắp xếp phải là "asc" hoặc "desc".'),
];

exports.acceptOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID.'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number.'),
];

exports.rejectOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID.'),
];

exports.completeOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID đơn hàng không hợp lệ.'),
];