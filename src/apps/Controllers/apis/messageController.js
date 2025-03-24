const UserModel = require('../../models/user');
const OrderModel = require('../../models/order');
const MessageModel = require('../../models/message');
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination'); // [Cải thiện 5.2] Import pagination

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
      is_read: false,
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
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // [Cải thiện 5.2] Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // [Cải thiện 5.2] Validation và xử lý sort
    const allowedSortFields = ['created_at', 'content', 'is_read'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {
      $or: [
        { sender_id: req.user._id },
        { receiver_id: req.user._id },
      ],
    };

    const paginationInfo = await pagination(page, limit, MessageModel, query);

    const messages = await MessageModel.find(query)
      .populate('sender_id', 'name role')
      .populate('receiver_id', 'name role')
      .populate('order_id', 'service_type status')
      .sort(sort) // [Cải thiện 5.2] Áp dụng sort
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    await MessageModel.updateMany(
      { receiver_id: req.user._id, is_read: false },
      { $set: { is_read: true } }
    );

    res.status(200).json({ success: true, messages, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};