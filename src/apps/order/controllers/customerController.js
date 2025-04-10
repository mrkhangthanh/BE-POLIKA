const { validationResult } = require('express-validator');
const OrderService = require('../services/orderService');
const pagination = require('../../../libs/pagination');
const ServiceType = require('../models/serviceType'); // Import danh sách service_types
const Order = require('../models/order'); // Import Order model

exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const order = await OrderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status } = req.query;

    // Kiểm tra page và limit có phải là số hợp lệ
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Tạo filter để đếm tổng số đơn hàng
    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    // Lấy danh sách đơn hàng
    const { orders } = await OrderService.getCustomerOrders(req.user._id, req.query);

    // Tính thông tin phân trang với filter
    const paginationInfo = await pagination(page, limit, Order, filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: paginationInfo,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {

    const result = await OrderService.cancelOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.user._id, req.params.id);
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// API mới: Lấy danh sách service_types
exports.getCategoryService = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find();
    res.status(200).json({ success: true, service_types: serviceTypes });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
