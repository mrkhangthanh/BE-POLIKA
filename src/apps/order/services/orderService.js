
const createOrder = require('./createOrder');
const updateOrder = require('./updateOrder');
const cancelOrder = require('./cancelOrder');
const getCustomerOrders = require('./getCustomerOrders');
const getAllOrders = require('./getAllOrder');
const getOrdersForTechnician = require('./getOrdersForTechnician');

const acceptOrder = require('./acceptOrder');
const rejectOrder = require('./rejectOrder');
const completeOrder = require('./completeOrder');
const getOrderById = require('./getOrderById');

class OrderService {
  // Tạo đơn hàng
  static async createOrder(userId, orderData) {
    return createOrder(userId, orderData);
  }

  // Cập nhật sửa đơn hàng
  static async updateOrder(userId, orderId, orderData) {
    return updateOrder(userId, orderId, orderData);
  }

  // Lấy danh sách đơn hàng của khách hàng đó
  static async getCustomerOrders(userId, query) {
    return getCustomerOrders(userId, query);
  }
  // Lấy danh sách đơn hàng của Tất cả khách hàng
  static async getAllOrders(query) {
    return getAllOrders(query);
  }


  // Hủy đơn hàng
  static async cancelOrder(userId, orderId) {
    return cancelOrder(userId, orderId);
  }

  // Lấy danh sách đơn hàng cho thợ sửa chữa
  static async getOrdersForTechnician(technician, query) {
    return getOrdersForTechnician(technician, query);
  }

  // Nhận đơn hàng
  static async acceptOrder(technician, orderId, price) {
    return acceptOrder(technician, orderId, price);
  }

  // Từ chối đơn hàng
  static async rejectOrder(technicianId, orderId) {
    return rejectOrder(technicianId, orderId);
  }

  // Hoàn thành đơn hàng
  static async completeOrder(technicianId, orderId) {
    return completeOrder(technicianId, orderId);
  }


  // Xem chi tiết đơn hàng
  static async getOrderById(userId, orderId) {
    return getOrderById(userId, orderId);
  }
}

module.exports = OrderService;
