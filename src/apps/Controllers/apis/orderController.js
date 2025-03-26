const UserModel = require('../../models/user');
const OrderModel = require('../../models/order');
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination'); // [Cải thiện 5.2] Import pagination
const logger = require('../../../libs/logger')

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

    const { service_type, description, address, phone_number } = req.body;

    const validServiceTypes = ['plumbing', 'electrical', 'carpentry', 'hvac'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({ error: 'Invalid service type. Must be one of: plumbing, electrical, carpentry, hvac' });
    }

    // Tìm user
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // [THÊM] Kiểm tra phone_number của user
    let orderPhoneNumber = user.phone_number;
    if (!orderPhoneNumber) {
      // Nếu user chưa có phone_number, yêu cầu phone_number trong request
      if (!phone_number) {
        return res.status(400).json({ error: 'Phone number is required. Please provide a phone number.' });
      }
      orderPhoneNumber = phone_number;

      // Cập nhật phone_number của user
      user.phone_number = phone_number;
    }

    // Kiểm tra address của user
    let orderAddress = user.address;
    const isAddressComplete = orderAddress?.street && orderAddress?.city && orderAddress?.district && orderAddress?.ward;

    if (!isAddressComplete) {
      // Nếu user chưa có address đầy đủ, yêu cầu address trong request
      if (!address || !address.street || !address.city || !address.district || !address.ward) {
        return res.status(400).json({ error: 'Address is required. Please provide street, city, district, and ward.' });
      }
      orderAddress = address;

      // Cập nhật address của user
      user.address = address;
    }

    // Lưu user nếu có thay đổi
    if (!user.phone_number || !isAddressComplete) {
      await user.save();
    }

    const orderData = {
      customer_id: req.user._id,
      service_type,
      description,
      address: orderAddress,
      price: 0,
    };

    const order = new OrderModel(orderData);
    const savedOrder = await order.save();

    logger.info(`Order created for user: ${user.email || user.phone_number} (ID: ${user._id}, Order ID: ${savedOrder._id})`);

    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    logger.error(`Create order error: ${err.message}`);
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
// [THÊM] Xem danh sách đơn hàng của khách hàng
exports.getCustomerOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can view their orders.' });
    }

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', status } = req.query;

    // Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Validation và xử lý sort
    const allowedSortFields = ['created_at', 'service_type', 'status', 'price'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Xây dựng query
    const query = {
      customer_id: req.user._id,
    };
    if (status) {
      query.status = status;
    }

    // Phân trang
    const paginationInfo = await pagination(page, limit, OrderModel, query);

    // Truy vấn danh sách đơn hàng
    const orders = await OrderModel.find(query)
      .populate('technician_id', 'name email phone_number') // Populate thông tin thợ sửa chữa
      .sort(sort)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    // Thêm phone_number của khách hàng vào response
    const user = await UserModel.findById(req.user._id).lean();
    const ordersWithCustomerInfo = orders.map(order => ({
      ...order,
      customer_phone_number: user.phone_number,
    }));

    logger.info(`Customer ${user.email || user.phone_number} (ID: ${user._id}) viewed their orders.`);

    res.status(200).json({
      success: true,
      orders: ordersWithCustomerInfo,
      pagination: paginationInfo,
    });
  } catch (err) {
    logger.error(`Get customer orders error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM] API hủy đơn hàng khi khách hàng không muốn tiếp tục dang ở trạng thái pending
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    // Kiểm tra user có phải là customer không
    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can cancel orders.' });
    }

    // Tìm đơn hàng
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Kiểm tra xem user có phải là người tạo đơn hàng không
    if (order.customer_id.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only cancel your own orders.' });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled.' });
    }

    // Cập nhật trạng thái đơn hàng thành 'cancelled'
    order.status = 'cancelled';
    await order.save();

    logger.info(`Order ${orderId} cancelled by user: ${user.email || user.phone_number} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    logger.error(`Cancel order error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM] API hoàn thành đơn hàng
exports.completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    // Kiểm tra user có phải là technician không
    if (user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can complete orders.' });
    }

    // Tìm đơn hàng
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Kiểm tra xem user có phải là technician được gán cho đơn hàng không
    if (!order.technician_id || order.technician_id.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to this order.' });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted orders can be completed.' });
    }

    // Cập nhật trạng thái đơn hàng thành 'completed'
    order.status = 'completed';
    await order.save();

    logger.info(`Order ${orderId} completed by technician: ${user.email || user.phone_number} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Order completed successfully.' });
  } catch (err) {
    logger.error(`Complete order error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Trong xem chi tiết một đơn hàng cụ thể
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Kiểm tra quyền truy cập
    if (
      order.customer_id.toString() !== user._id.toString() &&
      order.technician_id?.toString() !== user._id.toString()
    ) {
      return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    logger.error(`Get order by ID error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};