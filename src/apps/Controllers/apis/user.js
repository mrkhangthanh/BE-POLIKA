const UserModel = require('../../models/user');
const OrderModel = require('../../models/order');
const MessageModel = require('../../models/message');
const PostModel = require('../../models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../../../libs/logger');
const { body, validationResult } = require('express-validator');

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await UserModel.updateOne({ _id: user._id }, { last_login: new Date() });

    res.status(200).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Đăng ký (cho khách hàng)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, address, avatar } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone_number }] }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already exists.' });
    }

    const userData = {
      name,
      email,
      password,
      phone_number,
      role: 'customer',
      address,
      avatar: avatar || null, // Thêm avatar nếu có
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, token, user: savedUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Tạo user (cho admin)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, role, address, specialization, referred_by, avatar } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone_number }] }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already exists.' });
    }

    if ((role === 'customer' || role === 'technician') && (!address || !address.street || !address.city || !address.district || !address.ward)) {
      return res.status(400).json({ error: 'Address (street, city, district, ward) is required for customer and technician roles.' });
    }

    if (role === 'technician') {
      if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
        return res.status(400).json({ error: 'Specialization is required for technician role.' });
      }
      // Validate specialization
      const validSpecializations = ['plumbing', 'electrical', 'carpentry', 'hvac'];
      if (!specialization.every(spec => validSpecializations.includes(spec))) {
        return res.status(400).json({ error: 'Invalid specialization. Must be one of: plumbing, electrical, carpentry, hvac' });
      }
    }

    const userData = {
      name,
      email,
      password,
      phone_number,
      role,
      address: role === 'customer' || role === 'technician' ? address : undefined,
      specialization: role === 'technician' ? specialization : undefined,
      referred_by,
      avatar: avatar || null, // Thêm avatar nếu có
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    res.status(201).json({ success: true, user: savedUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách user
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await UserModel.find()
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await UserModel.countDocuments();
    const pagination = {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      next: page * limit < total ? parseInt(page) + 1 : null,
      prev: page > 1 ? parseInt(page) - 1 : null,
    };

    res.status(200).json({ success: true, users, pagination });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy thông tin user theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone_number, role, address, specialization, status, avatar } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (role === 'technician' && specialization) {
      const validSpecializations = ['plumbing', 'electrical', 'carpentry', 'hvac'];
      if (!specialization.every(spec => validSpecializations.includes(spec))) {
        return res.status(400).json({ error: 'Invalid specialization. Must be one of: plumbing, electrical, carpentry, hvac' });
      }
    }

    user.name = name || user.name;
    user.phone_number = phone_number || user.phone_number;
    user.role = role || user.role;
    user.address = (role === 'customer' || role === 'technician') ? address || user.address : undefined;
    user.specialization = role === 'technician' ? specialization || user.specialization : undefined;
    user.status = status || user.status;
    user.avatar = avatar !== undefined ? avatar : user.avatar; // Cập nhật avatar nếu có

    const updatedUser = await user.save();
    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.remove();
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Tạo đơn hàng (cho khách hàng)
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can create orders.' });
    }

    const { service_type, description, address } = req.body;

    // Validate service_type
    const validServiceTypes = ['plumbing', 'electrical', 'carpentry', 'hvac'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({ error: 'Invalid service type. Must be one of: plumbing, electrical, carpentry, hvac' });
    }

    const orderData = {
      customer_id: req.user._id,
      service_type,
      description,
      address,
      price: 0, // Giá mặc định là 0, technician sẽ cập nhật sau
    };

    const order = new OrderModel(orderData);
    const savedOrder = await order.save();

    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xem danh sách đơn hàng cho thợ sửa chữa
exports.getOrdersForTechnician = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can view orders.' });
    }

    const orders = await OrderModel.find({
      service_type: { $in: req.user.specialization },
      status: 'pending',
      technician_id: null,
    })
      .populate('customer_id', 'name email phone_number')
      .lean();

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Nhận đơn hàng
exports.acceptOrder = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can accept orders.' });
    }

    const { price } = req.body; // Technician có thể gửi giá khi nhận đơn
    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'pending' || order.technician_id) {
      return res.status(400).json({ error: 'Order is not available for acceptance.' });
    }

    if (!req.user.specialization.includes(order.service_type)) {
      return res.status(403).json({ error: 'Order does not match your specialization.' });
    }

    order.technician_id = req.user._id;
    order.status = 'accepted';
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number.' });
      }
      order.price = price; // Cập nhật giá nếu có
    }

    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Từ chối đơn hàng
exports.rejectOrder = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can reject orders.' });
    }

    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.technician_id && order.technician_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not assigned to this order.' });
    }

    order.technician_id = null;
    order.status = 'pending';
    order.price = 0; // Reset giá khi từ chối
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

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
      tags: tags || [], // Thêm tags nếu có
      views: 0, // Khởi tạo views
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

    const posts = await PostModel.find({ author_id: req.user._id }).lean();
    res.status(200).json({ success: true, posts });
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

    // Tăng số lượt xem
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
    post.tags = tags !== undefined ? tags : post.tags; // Cập nhật tags nếu có

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

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver_id, order_id, content } = req.body;

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message content cannot exceed 1000 characters.' });
    }

    if (req.user.role === 'customer') {
      const order = await OrderModel.findById(order_id);
      if (!order || order.customer_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only message related to your orders.' });
      }
      if (order.technician_id && order.technician_id.toString() !== receiver_id) {
        const receiver = await UserModel.findById(receiver_id);
        if (!receiver || receiver.role !== 'admin') {
          return res.status(403).json({ error: 'You can only message the assigned technician or admin.' });
        }
      }
    } else if (req.user.role === 'technician') {
      const order = await OrderModel.findById(order_id);
      if (!order || order.technician_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only message related to your orders.' });
      }
      if (order.customer_id.toString() !== receiver_id) {
        const receiver = await UserModel.findById(receiver_id);
        if (!receiver || receiver.role !== 'admin') {
          return res.status(403).json({ error: 'You can only message the customer or admin.' });
        }
      }
    } else if (req.user.role === 'admin') {
      const receiver = await UserModel.findById(receiver_id);
      if (!receiver || !['customer', 'technician'].includes(receiver.role)) {
        return res.status(403).json({ error: 'Admin can only message customers or technicians.' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied. Your role cannot send messages.' });
    }

    const messageData = {
      sender_id: req.user._id,
      receiver_id,
      order_id: order_id || null,
      content,
      is_read: false, // Khởi tạo tin nhắn chưa đọc
    };

    const message = new MessageModel(messageData);
    const savedMessage = await message.save();

    res.status(201).json({ success: true, message: savedMessage });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xem tin nhắn
exports.getMessages = async (req, res) => {
  try {
    const messages = await MessageModel.find({
      $or: [
        { sender_id: req.user._id },
        { receiver_id: req.user._id },
      ],
    })
      .populate('sender_id', 'name role')
      .populate('receiver_id', 'name role')
      .populate('order_id', 'service_type status')
      .lean();

    // Đánh dấu tin nhắn nhận được là đã đọc
    await MessageModel.updateMany(
      { receiver_id: req.user._id, is_read: false },
      { $set: { is_read: true } }
    );

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};