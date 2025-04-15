const { validationResult } = require('express-validator');
const OrderService = require('../services/orderService');
const pagination = require('../../../libs/pagination');
const ServiceType = require('../models/serviceType');
const Order = require('../models/order');
const UserModel = require('../../auth/models/user');
const { sendPushNotification } = require('../../../../firebase');

exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Received Order Data in createOrder:', JSON.stringify(req.body, null, 2));

    const { service_type, description, address, phone_number, price } = req.body;

    if (!service_type) {
      return res.status(400).json({ error: 'Service type is required.' });
    }

    // <span style="color:red">[CHỈNH SỬA]</span>: Tối ưu truy vấn ServiceType và thêm log
    const serviceType = await ServiceType.findOne({ value: service_type }).lean();
    if (!serviceType) {
      console.log(`Service type not found for value: ${service_type}`);
      return res.status(400).json({ error: `Invalid service type: ${service_type}. Must match a valid service type in the database.` });
    }
    console.log(`Found service type: ${serviceType.label} (ID: ${serviceType._id})`);

    const orderData = {
      ...req.body,
      service_type: serviceType._id,
    };

    // <span style="color:red">[CHỈNH SỬA]</span>: Thêm log trước khi tạo đơn hàng
    console.log(`Creating order for user ${req.user._id} with data:`, orderData);
    const order = await OrderService.createOrder(req.user._id, orderData);
    console.log(`Order created successfully: ${order._id}`);

    // Tìm các thợ phù hợp
    // <span style="color:red">[CHỈNH SỬA]</span>: Tối ưu truy vấn UserModel
    const technicians = await UserModel.find({
      role: 'technician',
      services: serviceType._id,
    })
      .select('name fcmToken')
      .lean();

    console.log(`Found ${technicians.length} technicians for service type ${serviceType.label}`);

    const notificationTitle = 'Đơn hàng mới!';
    const notificationBody = `Một đơn hàng mới trong lĩnh vực ${serviceType.label} vừa được tạo. Kiểm tra ngay!`;

    const notificationPromises = technicians.map((technician) => {
      if (technician.fcmToken) {
        return sendPushNotification(
          technician.fcmToken,
          notificationTitle,
          notificationBody
        )
          .then(() => {
            console.log(`Đã gửi thông báo đến thợ ${technician.name} (ID: ${technician._id})`);
          })
          .catch((notificationError) => {
            console.error(`Failed to send notification to technician ${technician.name} (ID: ${technician._id}):`, notificationError);
          });
      } else {
        console.log(`Thợ ${technician.name} (ID: ${technician._id}) không có FCM token.`);
        return Promise.resolve();
      }
    });

    Promise.all(notificationPromises).catch((err) => {
      console.error('Error in sending notifications:', err);
    });

    // <span style="color:red">[CHỈNH SỬA]</span>: Tối ưu truy vấn Order.find
    if (req.io) {
      const updatedOrders = await Order.find()
        .populate('customer_id', 'name')
        .populate('technician_id', 'name')
        .populate('service_type', 'label')
        .sort({ created_at: -1 })
        .limit(50)
        .lean(); // Sử dụng .lean() để tăng hiệu suất
      console.log('Sending order_update event with orders:', updatedOrders.length);
      req.io.emit('order_update', updatedOrders);
    } else {
      console.error('Socket.IO instance (req.io) is not available.');
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Error in createOrder:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Các hàm khác giữ nguyên
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

// lấy đơn hàng của từng khách hàng 1
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

    // Lấy danh sách đơn hàng của khách hàng cụ thể
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

// lấy đơn hàng của tất cả khách hàng có xác thực
exports.getAllOrders = async (req, res) => {
  try {
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status } = req.query;
    console.log('Query params:', { page, limit, status }); // Log query params

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Không giới hạn bởi customer_id, lấy tất cả đơn hàng
    const queryConditions = {};
    if (status) {
      queryConditions.status = status;
    }

    // Gọi OrderService.getAllOrders để lấy tất cả đơn hàng
    const { orders } = await OrderService.getAllOrders(req.query);


    console.log('Orders found in controller:', orders);

    // Sử dụng queryConditions cho pagination
    const paginationInfo = await pagination(page, limit, Order, queryConditions);

    console.log('Pagination info:', paginationInfo);

    res.status(200).json({
      success: true,
      orders,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// lấy danh sách đơn hàng tất cả khách hàng không có xác thực :
exports.getPublicOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status, service_type, 'address.city': city } = req.query;
    console.log('Query params for public-orders:', { page, limit, status, service_type, city });

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    const queryConditions = {
      is_active: true,
    };
    if (status) {
      queryConditions.status = status;
    }
    if (service_type) {
      // <span style="color:red">[CHỈNH SỬA]</span>: Xử lý service_type từ label sang value
      const serviceType = await ServiceType.findOne({ label: service_type });
      if (!serviceType) {
        console.log(`Service type not found for label: ${service_type}`);
        return res.status(400).json({ error: `Invalid service type: ${service_type}` });
      }
      console.log(`Found service type: ${serviceType.value} (ID: ${serviceType._id})`);
      queryConditions.service_type = serviceType._id;
    }
    if (city) {
      queryConditions['address.city'] = city;
    }

    const populatedOrders = await Order.find(queryConditions)
      .populate('customer_id', 'name')
      .populate('technician_id', 'name')
      .populate('service_type', 'label')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    console.log('Public orders found in controller:', populatedOrders);

    const paginationInfo = await pagination(page, limit, Order, queryConditions);
    console.log('Pagination info for public-orders:', paginationInfo);

    res.status(200).json({
      success: true,
      orders: populatedOrders,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error('Error in getPublicOrders:', err);
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

exports.getCategoryService = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find();
    res.status(200).json({ success: true, service_types: serviceTypes });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.createCategoryService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { value, label, isActive } = req.body;

    const existingServiceType = await ServiceType.findOne({ value });
    if (existingServiceType) {
      return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
    }

    const newServiceType = new ServiceType({
      value,
      label,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedServiceType = await newServiceType.save();
    res.status(201).json({ success: true, service_type: savedServiceType });
  } catch (err) {
    console.error('Error in createCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.updateCategoryService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { value, label, isActive } = req.body;

    const serviceType = await ServiceType.findById(id);
    if (!serviceType) {
      return res.status(404).json({ error: 'Danh mục dịch vụ không tồn tại.' });
    }

    if (value && value !== serviceType.value) {
      const existingServiceType = await ServiceType.findOne({ value });
      if (existingServiceType) {
        return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
      }
    }

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

exports.deleteCategoryService = async (req, res) => {
  try {
    const { id } = req.params;

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
