const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const postValidator = require('../validators/postValidator');
const authMiddleware = require('../../middlewares/auth');
const handleValidationErrors = require('../../middlewares/validationError');
const requireRole = require('../../middlewares/requireRole');

// Quản lý bài viết (content writer)
// Tạo bài viết
router.post(
    '/posts',
    authMiddleware,
    requireRole(['content_writer']),
    postValidator.createPostValidation,
    handleValidationErrors,
    postController.createPost
  );
  
  // Xem danh sách bài viết của content writer
  router.get(
    '/posts',
    authMiddleware,
    requireRole(['content_writer']),
    postValidator.getPostsValidation,
    handleValidationErrors,
    postController.getPosts
  );
  
  // Xem danh sách bài viết công khai (chỉ published)
  router.get(
    '/public-posts',
    postValidator.getPublicPostsValidation,
    handleValidationErrors,
    postController.getPublicPosts
  );
  
  // Xem chi tiết bài viết của content writer (tăng views)
  router.get(
    '/posts/:id',
    authMiddleware,
    requireRole(['content_writer']),
    postValidator.getPostByIdValidation,
    handleValidationErrors,
    postController.getPostById
  );
  
  // Xem chi tiết bài viết công khai (tăng views)
  router.get(
    '/public-posts/:id',
    postValidator.getPostByIdValidation,
    handleValidationErrors,
    postController.getPublicPostById
  );
  
  // Cập nhật bài viết
  router.put(
    '/posts/:id',
    authMiddleware,
    requireRole(['content_writer']),
    postValidator.updatePostValidation,
    handleValidationErrors,
    postController.updatePost
  );
  
  // Xóa bài viết
  router.delete(
    '/posts/:id',
    authMiddleware,
    requireRole(['content_writer']),
    postValidator.deletePostValidation,
    handleValidationErrors,
    postController.deletePost
  );
  
  // Xem thống kê bài viết
  router.get(
    '/posts/stats',
    authMiddleware,
    requireRole(['content_writer']),
    postController.getPostStats
  );
  
  // Quản lý bài viết (admin)
  // Xem danh sách tất cả bài viết
  router.get(
    '/admin/posts',
    authMiddleware,
    requireRole(['admin']),
    postValidator.getAllPostsValidation,
    handleValidationErrors,
    postController.getAllPosts
  );
  
  // Xem chi tiết bài viết (admin)
  router.get(
    '/admin/posts/:id',
    authMiddleware,
    requireRole(['admin']),
    postValidator.getPostByIdValidation,
    handleValidationErrors,
    postController.getPostByIdAdmin
  );
  
  // Cập nhật bài viết (admin)
  router.put(
    '/admin/posts/:id',
    authMiddleware,
    requireRole(['admin']),
    postValidator.updatePostAdminValidation,
    handleValidationErrors,
    postController.updatePostAdmin
  );
  
  // Xóa bài viết (admin)
  router.delete(
    '/admin/posts/:id',
    authMiddleware,
    requireRole(['admin']),
    postValidator.deletePostValidation,
    handleValidationErrors,
    postController.deletePostAdmin
  );
  
  // Tính năng thích bài viết
  // Thích bài viết công khai
  router.post(
    '/posts/:id/like',
    authMiddleware,
    postValidator.likePostValidation,
    handleValidationErrors,
    postController.likePost
  );
  
  // Bỏ thích bài viết công khai
  router.post(
    '/posts/:id/unlike',
    authMiddleware,
    postValidator.likePostValidation,
    handleValidationErrors,
    postController.unlikePost
  );
  

module.exports = router;