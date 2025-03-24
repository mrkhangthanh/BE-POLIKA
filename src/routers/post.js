const express = require('express');
const router = express.Router();
const postController = require('../apps/Controllers/apis/postController');
const postValidator = require('../validators/postValidator');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Quản lý bài viết
router.post('/posts',authMiddleware,postValidator.createPostValidation,postController.createPost);
  
  router.get('/posts/:id', authMiddleware, postController.getPostById);
  
  router.get('/posts', authMiddleware, postController.getPosts);
  router.put('/posts/:id', authMiddleware, postController.updatePost);
  router.delete('/posts/:id', authMiddleware, postController.deletePost);

  module.exports = router;