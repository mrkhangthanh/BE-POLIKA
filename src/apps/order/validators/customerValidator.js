const { body, query } = require('express-validator');
const UserModel = require('../../auth/models/user');
const { VALID_SERVICE_TYPES } = require('../../Shared/constants/serviceTypes');
const { VALID_STATUSES } = require('../../Shared/constants/orderStatuses');
const { CUSTOMER_SORT_FIELDS, VALID_SORT_ORDERS } = require('../../Shared/constants/sortFields');

exports.createOrderValidation = [
  body('service_type')
    .notEmpty()
    .withMessage('Loại dịch vụ không được để trống.')
    .isIn(VALID_SERVICE_TYPES)
    .withMessage(`Loại dịch vụ phải là một trong: ${VALID_SERVICE_TYPES.join(', ')}`),
  
  body('description')
    .notEmpty()
    .withMessage('Mô tả không được để trống.')
    .trim(),
  
  body('address.street')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ đường không được để trống nếu đã cung cấp.'),
  
  body('address.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Thành phố không được để trống nếu đã cung cấp.'),
  
  body('address.district')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Quận/Huyện không được để trống nếu đã cung cấp.'),
  
  body('address.ward')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phường/Xã không được để trống nếu đã cung cấp.'),
  
  body('address.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Quốc gia không được để trống nếu đã cung cấp.'),
  
  body('phone_number')
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Số điện thoại phải có từ 10 đến 11 chữ số.')
    .custom(async (value, { req }) => {
      if (value) {
        const user = await UserModel.findOne({ phone_number: value });
        if (user && user._id.toString() !== req.user._id.toString()) {
          throw new Error('Số điện thoại đã tồn tại.');
        }
      }
      return true;
    }),

  body('price')
    .notEmpty()
    .withMessage('Giá trị đơn hàng không được để trống.')
    .isFloat({ min: 0 })
    .withMessage('Giá trị đơn hàng phải là số không âm.'),
];

exports.getCustomerOrdersValidation = [
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
    .isIn(CUSTOMER_SORT_FIELDS)
    .withMessage(`Sắp xếp theo phải là một trong: ${CUSTOMER_SORT_FIELDS.join(', ')}`),
  
  query('sortOrder')
    .optional()
    .isIn(VALID_SORT_ORDERS)
    .withMessage('Thứ tự sắp xếp phải là "asc" hoặc "desc".'),
  
  query('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Trạng thái phải là một trong: ${VALID_STATUSES.join(', ')}`),
];

