const PostModel = require('../../models/post');
const logger = require('../../../libs/logger');
const pagination = require('../../../libs/pagination');

// Tạo bài viết (content writer)
exports.createPost = async (req, res) => {
  try {
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

    logger.info(`Post created by user: ${req.user.email} (ID: ${req.user._id})`);
    res.status(201).json({ success: true, post: savedPost });
  } catch (err) {
    logger.error(`Create post error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách bài viết của content writer (hỗ trợ tìm kiếm, lọc, phân trang, sắp xếp)
exports.getPosts = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can view posts.' });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      tags,
      search,
      startDate,
      endDate,
    } = req.query;

    const query = { author_id: req.user._id };

    // Lọc theo status
    if (status) query.status = status;

    // Lọc theo tags
    if (tags) query.tags = { $in: tags.split(',') };

    // Tìm kiếm theo từ khóa trong title hoặc content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Lọc theo khoảng thời gian tạo
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    const allowedSortFields = ['title', 'created_at', 'status', 'views'];
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const paginationInfo = await pagination(page, limit, PostModel, query);

    const posts = await PostModel.find(query)
      .sort(sort)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .populate('author_id', 'name email')
      .lean();

    res.status(200).json({ success: true, posts, pagination: paginationInfo });
  } catch (err) {
    logger.error(`Get posts error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách bài viết công khai (chỉ published)
exports.getPublicPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      tags,
      search,
    } = req.query;

    const query = { status: 'published' };

    // Lọc theo tags
    if (tags) query.tags = { $in: tags.split(',') };

    // Tìm kiếm theo từ khóa trong title hoặc content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSortFields = ['title', 'created_at', 'views'];
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const paginationInfo = await pagination(page, limit, PostModel, query);

    const posts = await PostModel.find(query)
      .sort(sort)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .populate('author_id', 'name email')
      .lean();

    res.status(200).json({ success: true, posts, pagination: paginationInfo });
  } catch (err) {
    logger.error(`Get public posts error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy bài viết theo ID (content writer, tăng views)
exports.getPostById = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can view posts.' });
    }

    const post = await PostModel.findById(req.params.id).populate('author_id', 'name email').lean();
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.author_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only view your own posts.' });
    }

    // Tăng views
    await PostModel.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    res.status(200).json({ success: true, post });
  } catch (err) {
    logger.error(`Get post by ID error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy bài viết công khai theo ID (tăng views)
exports.getPublicPostById = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id).populate('author_id', 'name email').lean();
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.status !== 'published') {
      return res.status(403).json({ error: 'Access denied. This post is not published.' });
    }

    // Tăng views
    await PostModel.updateOne({ _id: req.params.id }, { $inc: { views: 1 } });

    res.status(200).json({ success: true, post });
  } catch (err) {
    logger.error(`Get public post by ID error: ${err.message}`);
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

    logger.info(`Post updated by user: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, post });
  } catch (err) {
    logger.error(`Update post error: ${err.message}`);
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
    logger.info(`Post deleted by user: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    logger.error(`Delete post error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Thống kê bài viết của content writer
exports.getPostStats = async (req, res) => {
  try {
    if (req.user.role !== 'content_writer') {
      return res.status(403).json({ error: 'Access denied. Only content writers can view stats.' });
    }

    const totalPosts = await PostModel.countDocuments({ author_id: req.user._id });
    const postsByStatus = await PostModel.aggregate([
      { $match: { author_id: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const totalViews = await PostModel.aggregate([
      { $match: { author_id: req.user._id } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);

    const stats = {
      totalPosts,
      postsByStatus: postsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, { draft: 0, published: 0, archived: 0 }),
      totalViews: totalViews[0]?.totalViews || 0,
    };

    res.status(200).json({ success: true, stats });
  } catch (err) {
    logger.error(`Get post stats error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách tất cả bài viết (dành cho admin)
exports.getAllPosts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can view all posts.' });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      tags,
      search,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Lọc theo status
    if (status) query.status = status;

    // Lọc theo tags
    if (tags) query.tags = { $in: tags.split(',') };

    // Tìm kiếm theo từ khóa trong title hoặc content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Lọc theo khoảng thời gian tạo
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    const allowedSortFields = ['title', 'created_at', 'status', 'views'];
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const paginationInfo = await pagination(page, limit, PostModel, query);

    const posts = await PostModel.find(query)
      .sort(sort)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .populate('author_id', 'name email')
      .lean();

    res.status(200).json({ success: true, posts, pagination: paginationInfo });
  } catch (err) {
    logger.error(`Get all posts error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy bài viết theo ID (dành cho admin)
exports.getPostByIdAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can view posts.' });
    }

    const post = await PostModel.findById(req.params.id).populate('author_id', 'name email').lean();
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    res.status(200).json({ success: true, post });
  } catch (err) {
    logger.error(`Get post by ID (admin) error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Cập nhật bài viết (dành cho admin)
exports.updatePostAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can update posts.' });
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const { title, content, status, tags } = req.body;
    post.title = title || post.title;
    post.content = content || post.content;
    post.status = status || post.status;
    post.tags = tags !== undefined ? tags : post.tags;

    await post.save();

    logger.info(`Post updated by admin: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, post });
  } catch (err) {
    logger.error(`Update post (admin) error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xóa bài viết (dành cho admin)
exports.deletePostAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can delete posts.' });
    }

    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await post.remove();
    logger.info(`Post deleted by admin: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    logger.error(`Delete post (admin) error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Thích bài viết (chỉ trên bài viết công khai)
exports.likePost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Bài viết không tồn tại.' });
    }

    if (post.status !== 'published') {
      return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Bạn chỉ có thể thích các bài viết đã được xuất bản.' });
    }

    const userId = req.user._id;
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Bạn đã thích bài viết này rồi.' });
    }

    post.likes.push(userId);
    await post.save();

    logger.info(`Bài viết được thích bởi người dùng: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, message: 'Thích bài viết thành công.', likes: post.likes.length });
  } catch (err) {
    logger.error(`Lỗi khi thích bài viết: ${err.message}`);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ', details: err.message });
  }
};

// Bỏ thích bài viết
exports.unlikePost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Bài viết không tồn tại.' });
    }

    if (post.status !== 'published') {
      return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Bạn chỉ có thể bỏ thích các bài viết đã được xuất bản.' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      return res.status(400).json({ error: 'Bạn chưa thích bài viết này.' });
    }

    post.likes.splice(likeIndex, 1);
    await post.save();

    logger.info(`Bài viết được bỏ thích bởi người dùng: ${req.user.email} (ID: ${req.user._id})`);
    res.status(200).json({ success: true, message: 'Bỏ thích bài viết thành công.', likes: post.likes.length });
  } catch (err) {
    logger.error(`Lỗi khi bỏ thích bài viết: ${err.message}`);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ', details: err.message });
  }
};