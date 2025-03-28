const {query} = require('express-validator');

// Thêm validation cho getCommission
exports.getCommissionValidation = [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày bắt đầu phải là một ngày hợp lệ theo định dạng ISO 8601.'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày kết thúc phải là một ngày hợp lệ theo định dạng ISO 8601.'),
    query('startDate')
      .if(query('endDate').exists())
      .custom((startDate, { req }) => {
        const start = new Date(startDate);
        const end = new Date(req.query.endDate);
        if (start > end) {
          throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
        }
        return true;
      }),
  ];