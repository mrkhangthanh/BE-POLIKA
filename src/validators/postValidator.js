const { body, param, query } = require('express-validator');

// Validation cho createPost
exports.createPostValidation = [
  body('title').notEmpty().withMessage('Tiêu đề là bắt buộc.'),
  body('content').notEmpty().withMessage('Nội dung là bắt buộc.'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Trạng thái phải là một trong: draft, published, archived.'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Thẻ (tags) phải là một mảng chuỗi.')
    .custom((tags) => {
      if (tags.length > 0) {
        return tags.every(tag => typeof tag === 'string' && /^[a-zA-Z0-9]+$/.test(tag));
      }
      return true;
    })
    .withMessage('Mỗi thẻ (tag) phải là một chuỗi chỉ chứa chữ cái và số.'),
];

// Validation cho getPosts (dành cho content writer)
exports.getPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100.'),
  query('sortBy')
    .optional()
    .isIn(['title', 'created_at', 'status', 'views'])
    .withMessage('Sắp xếp theo phải là một trong: title, created_at, status, views.'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là "asc" hoặc "desc".'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Trạng thái phải là một trong: draft, published, archived.'),
  query('tags')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9,]+$/).withMessage('Thẻ (tags) phải là một chuỗi phân tách bằng dấu phẩy, chỉ chứa chữ cái và số.')
    .notEmpty().withMessage('Thẻ (tags) không được để trống.'),
  query('search')
    .optional()
    .isString()
    .isLength({ min: 2 }).withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự.'),
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

// Validation cho getPublicPosts (dành cho người dùng công khai)
exports.getPublicPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100.'),
  query('sortBy')
    .optional()
    .isIn(['title', 'created_at', 'views'])
    .withMessage('Sắp xếp theo phải là một trong: title, created_at, views.'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là "asc" hoặc "desc".'),
  query('tags')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9,]+$/).withMessage('Thẻ (tags) phải là một chuỗi phân tách bằng dấu phẩy, chỉ chứa chữ cái và số.')
    .notEmpty().withMessage('Thẻ (tags) không được để trống.'),
  query('search')
    .optional()
    .isString()
    .isLength({ min: 2 }).withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự.'),
];

// Validation cho getAllPosts (dành cho admin)
exports.getAllPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100.'),
  query('sortBy')
    .optional()
    .isIn(['title', 'created_at', 'status', 'views'])
    .withMessage('Sắp xếp theo phải là một trong: title, created_at, status, views.'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là "asc" hoặc "desc".'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Trạng thái phải là một trong: draft, published, archived.'),
  query('tags')
    .optional()
    .isString()
    .matches(/^[a-zA-Z0-9,]+$/).withMessage('Thẻ (tags) phải là một chuỗi phân tách bằng dấu phẩy, chỉ chứa chữ cái và số.')
    .notEmpty().withMessage('Thẻ (tags) không được để trống.'),
  query('search')
    .optional()
    .isString()
    .isLength({ min: 2 }).withMessage('Từ khóa tìm kiếm phải có ít nhất 2 ký tự.'),
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

// Validation cho getPostById
exports.getPostByIdValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
];

// Validation cho updatePost
exports.updatePostValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
  body('title').optional().notEmpty().withMessage('Tiêu đề không được để trống.'),
  body('content').optional().notEmpty().withMessage('Nội dung không được để trống.'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Trạng thái phải là một trong: draft, published, archived.'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Thẻ (tags) phải là một mảng chuỗi.')
    .custom((tags) => {
      if (tags.length > 0) {
        return tags.every(tag => typeof tag === 'string' && /^[a-zA-Z0-9]+$/.test(tag));
      }
      return true;
    })
    .withMessage('Mỗi thẻ (tag) phải là một chuỗi chỉ chứa chữ cái và số.'),
];

// Validation cho updatePostAdmin giống updatePostValidation
exports.updatePostAdminValidation = exports.updatePostValidation;

// Validation cho deletePost
exports.deletePostValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
];

// Validation cho likePost và unlikePost
exports.likePostValidation = [
  param('id').isMongoId().withMessage('ID bài viết không hợp lệ.'),
];

// Validation cho createComment
exports.createCommentValidation = [
  param('postId').isMongoId().withMessage('ID bài viết không hợp lệ.'),
  body('content').notEmpty().withMessage('Nội dung bình luận là bắt buộc.'),
];

// Validation cho getComments
exports.getCommentsValidation = [
  param('postId').isMongoId().withMessage('ID bài viết không hợp lệ.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100.'),
];

// Validation cho deleteComment
exports.deleteCommentValidation = [
  param('commentId').isMongoId().withMessage('ID bình luận không hợp lệ.'),
];