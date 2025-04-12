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

    console.log('Received Order Data in createOrder:', JSON.stringify(req.body, null, 2)); // Log dữ liệu nhận được

    const order = await OrderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Error in createOrder:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
exports.updateOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await OrderService.updateOrder(req.user._id, req.params.id, req.body);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Error in updateOrder:', err);
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

// API mới: Tạo danh mục dịch vụ (POST /category-service)
exports.createCategoryService = async (req, res) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { value, label, isActive } = req.body;

    // Kiểm tra xem value đã tồn tại chưa
    const existingServiceType = await ServiceType.findOne({ value });
    if (existingServiceType) {
      return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
    }

    // Tạo danh mục dịch vụ mới
    const newServiceType = new ServiceType({
      value,
      label,
      isActive: isActive !== undefined ? isActive : true, // Mặc định là true nếu không cung cấp
    });

    const savedServiceType = await newServiceType.save();
    res.status(201).json({ success: true, service_type: savedServiceType });
  } catch (err) {
    console.error('Error in createCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// API mới: Cập nhật danh mục dịch vụ (PUT /category-service/:id)
exports.updateCategoryService = async (req, res) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { value, label, isActive } = req.body;

    // Tìm danh mục dịch vụ theo ID
    const serviceType = await ServiceType.findById(id);
    if (!serviceType) {
      return res.status(404).json({ error: 'Danh mục dịch vụ không tồn tại.' });
    }

    // Kiểm tra xem value mới có trùng với danh mục khác không
    if (value && value !== serviceType.value) {
      const existingServiceType = await ServiceType.findOne({ value });
      if (existingServiceType) {
        return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
      }
    }

    // Cập nhật các trường
    if (value) serviceType.value = value;
    if (label) serviceType.label = label;
    if (isActive !== undefined) serviceType.isActive = isActive;

    const updatedServiceType = await serviceType.save();
    res.status(200).json({ success: true, service_type: updatedServiceType });
  } catch (err) {
    console.error('Error in updateCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// API mới: Xóa danh mục dịch vụ (DELETE /category-service/:id)
exports.deleteCategoryService = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm và xóa danh mục dịch vụ theo ID
    const serviceType = await ServiceType.findByIdAndDelete(id);
    if (!serviceType) {
      return res.status(404).json({ error: 'Danh mục dịch vụ không tồn tại.' });
    }

    res.status(200).json({ success: true, message: 'Danh mục dịch vụ đã được xóa.' });
  } catch (err) {
    console.error('Error in deleteCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
