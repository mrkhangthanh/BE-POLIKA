const UserModel = require('../../auth/models/user');
const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');
const { VALID_SERVICE_TYPES } = require('../../Shared/constants/serviceTypes');
const { PENDING, ACCEPTED, CANCELLED, COMPLETED } = require('../../Shared/constants/orderStatuses');
const { CUSTOMER_SORT_FIELDS, TECHNICIAN_SORT_FIELDS, VALID_SORT_ORDERS } = require('../../Shared/constants/sortFields');

class OrderService {
  // Tạo đơn hàng
  static async createOrder(userId, orderData) {
    const { service_type, description, address, phone_number, price } = orderData;

    // Kiểm tra loại dịch vụ
    if (!VALID_SERVICE_TYPES.includes(service_type)) {
      throw new Error(`Invalid service type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}`);
    }

    // Tìm user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    // Kiểm tra và cập nhật phone_number
    let orderPhoneNumber = user.phone_number;
    if (!orderPhoneNumber) {
      if (!phone_number) {
        throw new Error('Phone number is required. Please provide a phone number.');
      }
      orderPhoneNumber = phone_number;
      user.phone_number = phone_number;
    }

    // Kiểm tra và cập nhật address
    let orderAddress = user.address;
    const isAddressComplete = orderAddress?.street && orderAddress?.city && orderAddress?.district && orderAddress?.ward;

    if (!isAddressComplete) {
      if (!address || !address.street || !address.city || !address.district || !address.ward) {
        throw new Error('Address is required. Please provide street, city, district, and ward.');
      }
      orderAddress = address;
      user.address = address;
    }

    // Lưu user nếu có thay đổi
    if (!user.phone_number || !isAddressComplete) {
      await user.save();
    }

    // Tạo đơn hàng
    const newOrder = new OrderModel({
      customer_id: userId,
      service_type,
      description,
      price,
      address: orderAddress,
      phone_number: orderPhoneNumber,
      status: PENDING,
    });

    const savedOrder = await newOrder.save();
    logger.info(`Order created for user: ${user.email || user.phone_number} (ID: ${user._id}, Order ID: ${savedOrder._id})`);

    return savedOrder;
  }

  // Lấy danh sách đơn hàng của khách hàng
  static async getCustomerOrders(userId, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', status } = query;

    // Kiểm tra sortBy và sortOrder
    if (!CUSTOMER_SORT_FIELDS.includes(sortBy)) {
      throw new Error(`SortBy must be one of: ${CUSTOMER_SORT_FIELDS.join(', ')}`);
    }
    if (!VALID_SORT_ORDERS.includes(sortOrder)) {
      throw new Error('SortOrder must be "asc" or "desc".');
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const queryConditions = { customer_id: userId };
    if (status) {
      queryConditions.status = status;
    }

    const orders = await OrderModel.find(queryConditions)
      .populate('technician_id', 'name email phone_number')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const user = await UserModel.findById(userId).lean();
    const ordersWithCustomerInfo = orders.map(order => ({
      ...order,
      customer_phone_number: user.phone_number,
    }));

    logger.info(`Customer ${user.email || user.phone_number} (ID: ${user._id}) viewed their orders.`);

    return { orders: ordersWithCustomerInfo, total: await OrderModel.countDocuments(queryConditions) };
  }

  // Hủy đơn hàng
  static async cancelOrder(userId, orderId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.customer_id.toString() !== userId.toString()) {
      throw new Error('Access denied. You can only cancel your own orders.');
    }

    if (order.status !== PENDING) {
      throw new Error('Only pending orders can be cancelled.');
    }

    order.status = CANCELLED;
    await order.save();

    const user = await UserModel.findById(userId).lean();
    logger.info(`Order ${orderId} cancelled by user: ${user.email || user.phone_number} (ID: ${user._id})`);

    return { message: 'Order cancelled successfully.' };
  }

  // Lấy danh sách đơn hàng cho thợ sửa chữa
  static async getOrdersForTechnician(technician, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = query;

    // Kiểm tra sortBy và sortOrder
    if (!TECHNICIAN_SORT_FIELDS.includes(sortBy)) {
      throw new Error(`SortBy must be one of: ${TECHNICIAN_SORT_FIELDS.join(', ')}`);
    }
    if (!VALID_SORT_ORDERS.includes(sortOrder)) {
      throw new Error('SortOrder must be "asc" or "desc".');
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const queryConditions = {
      service_type: { $in: technician.specialization },
      status: PENDING,
      technician_id: null,
    };

    const orders = await OrderModel.find(queryConditions)
      .populate('customer_id', 'name email phone_number')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    return { orders, total: await OrderModel.countDocuments(queryConditions) };
  }

  // Nhận đơn hàng
  static async acceptOrder(technician, orderId, price) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status !== PENDING || order.technician_id) {
      throw new Error('Order is not available for acceptance.');
    }

    if (!technician.specialization.includes(order.service_type)) {
      throw new Error('Order does not match your specialization.');
    }

    order.technician_id = technician._id;
    order.status = ACCEPTED;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        throw new Error('Price must be a non-negative number.');
      }
      order.price = price;
    }

    await order.save();
    return order;
  }

  // Từ chối đơn hàng
  static async rejectOrder(technicianId, orderId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.technician_id && order.technician_id.toString() !== technicianId.toString()) {
      throw new Error('You are not assigned to this order.');
    }

    order.technician_id = null;
    order.status = PENDING;
    order.price = 0;
    await order.save();

    return order;
  }

  // Hoàn thành đơn hàng
  static async completeOrder(technicianId, orderId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (!order.technician_id || order.technician_id.toString() !== technicianId.toString()) {
      throw new Error('Access denied. You are not assigned to this order.');
    }

    if (order.status !== ACCEPTED) {
      throw new Error('Only accepted orders can be completed.');
    }

    order.status = COMPLETED;
    await order.save();

    const technician = await UserModel.findById(technicianId).lean();
    logger.info(`Order ${orderId} completed by technician: ${technician.email || technician.phone_number} (ID: ${technician._id})`);

    return { message: 'Order completed successfully.' };
  }

  // Xem chi tiết đơn hàng
  static async getOrderById(userId, orderId) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (
      order.customer_id.toString() !== userId.toString() &&
      order.technician_id?.toString() !== userId.toString()
    ) {
      throw new Error('Access denied. You can only view your own orders.');
    }

    return order;
  }
}

module.exports = OrderService;