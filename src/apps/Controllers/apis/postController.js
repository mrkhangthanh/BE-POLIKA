const PostModel = require('../../models/post');
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination'); // [Cải thiện 5.2] Import pagination

// Tạo bài viết (content writer)
exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can create posts.' });
    }

    const { title, content, status, tags } = req.body;
    const postData = {
      title,
      content,
      author_id: req.user._id,
      status: status || 'draft',
      tags: tags || [],
      views: 0,
    };

    const post = new PostModel(postData);
    const savedPost = await post.save();

    res.status(201).json({ success: true, post: savedPost });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách bài viết
exports.getPosts = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can view posts.' });
    }

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // [Cải thiện 5.2] Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // [Cải thiện 5.2] Validation và xử lý sort
    const allowedSortFields = ['title', 'created_at', 'status', 'views'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = { author_id: req.user._id };
    const paginationInfo = await pagination(page, limit, PostModel, query);

    const posts = await PostModel.find(query)
      .sort(sort) // [Cải thiện 5.2] Áp dụng sort
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    res.status(200).json({ success: true, posts, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy bài viết theo ID (tăng views)
exports.getPostById = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can view posts.' });
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only view your own posts.' });
    }

    post.views += 1;
    await post.save();

    res.status(200).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can update posts.' });
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only update your own posts.' });
    }

    const { title, content, status, tags } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;
    post.status = status || post.status;
    post.tags = tags !== undefined ? tags : post.tags;

    await post.save();

    res.status(200).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can delete posts.' });
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await post.remove();
    res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};