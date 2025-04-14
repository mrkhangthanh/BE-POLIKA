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

    // Đảm bảo service_type là bắt buộc
    if (!service_type) {
      return res.status(400).json({ error: 'Service type is required.' });
    }

    // Tìm _id của service_type dựa trên value
    const serviceType = await ServiceType.findOne({ value: service_type });
    if (!serviceType) {
      return res.status(400).json({ error: `Invalid service type: ${service_type}. Must match a valid service type in the database.` });
    }

    // Tạo đơn hàng
    const orderData = {
      ...req.body,
      service_type: serviceType._id, // Lưu _id của service_type vào đơn hàng
    };
    const order = await OrderService.createOrder(req.user._id, orderData);

    // Tìm các thợ phù hợp dựa trên service_type của đơn hàng
    const technicians = await UserModel.find({
      role: 'technician',
      services: serviceType._id, // Tìm thợ có lĩnh vực phù hợp
    });

    // Gửi thông báo push đến các thợ
    const notificationTitle = 'Đơn hàng mới!';
    const notificationBody = `Một đơn hàng mới trong lĩnh vực ${serviceType.label} vừa được tạo. Kiểm tra ngay!`;

    const notificationPromises = technicians.map(async (technician) => {
      if (technician.fcmToken) {
        try {
          await sendPushNotification(
            technician.fcmToken,
            notificationTitle,
            notificationBody
          );
          console.log(`Đã gửi thông báo đến thợ ${technician.name} (ID: ${technician._id})`);
        } catch (notificationError) {
          console.error(`Failed to send notification to technician ${technician.name} (ID: ${technician._id}):`, notificationError);
        }
      } else {
        console.log(`Thợ ${technician.name} (ID: ${technician._id}) không có FCM token.`);
      }
    });

    // Chờ tất cả thông báo được gửi (nhưng không làm ảnh hưởng đến response chính)
    await Promise.all(notificationPromises);

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


// exports.getCustomerOrders = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { page = 1, limit = 10, status } = req.query;
//     console.log('Query params:', { page, limit, status }); // Log query params

//     if (isNaN(page) || isNaN(limit)) {
//       return res.status(400).json({ error: 'Page and limit must be numbers.' });
//     }
//     if (parseInt(limit) > 100) {
//       return res.status(400).json({ error: 'Limit cannot exceed 100.' });
//     }

//     // Không giới hạn bởi customer_id, lấy tất cả đơn hàng
//     const queryConditions = {};
//     if (status) {
//       queryConditions.status = status;
//     }

//     // Gọi OrderService.getCustomerOrders mà không truyền userId
//     const { orders } = await OrderService.getCustomerOrders(req.query);

//     console.log('Orders found in controller:', orders);

//     // Sử dụng queryConditions cho pagination
//     const paginationInfo = await pagination(page, limit, Order, queryConditions);

//     console.log('Pagination info:', paginationInfo);

//     res.status(200).json({
//       success: true,
//       orders,
//       pagination: paginationInfo,
//     });
//   } catch (err) {
//     console.error('Error in getCustomerOrders:', err);
//     res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// };


// lấy tất cả danh sách đơn hàng 

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

    // Gọi OrderService.getCustomerOrders mà không truyền userId
    const { orders } = await OrderService.getCustomerOrders(req.query);

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