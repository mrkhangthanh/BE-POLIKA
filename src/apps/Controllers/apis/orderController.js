const UserModel = require('../../models/user');
const OrderModel = require('../../models/order');
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination'); // [Cải thiện 5.2] Import pagination

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

    const validServiceTypes = ['plumbing', 'electrical', 'carpentry', 'hvac'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({ error: 'Invalid service type. Must be one of: plumbing, electrical, carpentry, hvac' });
    }

    const orderData = {
      customer_id: req.user._id,
      service_type,
      description,
      address,
      price: 0,
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

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // [Cải thiện 5.2] Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // [Cải thiện 5.2] Validation và xử lý sort
    const allowedSortFields = ['created_at', 'service_type', 'description'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {
      service_type: { $in: req.user.specialization },
      status: 'pending',
      technician_id: null,
    };

    const paginationInfo = await pagination(page, limit, OrderModel, query);

    const orders = await OrderModel.find(query)
      .populate('customer_id', 'name email phone_number')
      .sort(sort) // [Cải thiện 5.2] Áp dụng sort
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    res.status(200).json({ success: true, orders, pagination: paginationInfo });
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

    const { price } = req.body;
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
      order.price = price;
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
    order.price = 0;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};