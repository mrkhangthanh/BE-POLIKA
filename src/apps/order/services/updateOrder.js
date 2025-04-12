const mongoose = require('mongoose');
const OrderModel = require('../models/order');
const UserModel = require('../../auth/models/user');
const logger = require('../../../libs/logger');
const { PENDING } = require('../../Shared/constants/orderStatuses');

async function updateOrder(userId, orderId, orderData) {
  const { address, price, phone_number, description } = orderData;

  // Kiểm tra orderId có phải là ObjectId hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error('Invalid order ID.');
  }

  // Tìm đơn hàng
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new Error('Order not found.');
  }

  // Kiểm tra quyền truy cập
  if (order.customer_id.toString() !== userId.toString()) {
    throw new Error('Access denied. You can only update your own orders.');
  }

  // Kiểm tra trạng thái đơn hàng
  if (order.status !== PENDING) {
    throw new Error('Only pending orders can be updated.');
  }

  // Cập nhật các trường
  if (address) {
    const { street, city, district, ward, country } = address;
    if (!street || !city || !district || !ward) {
      throw new Error('Address must include street, city, district, and ward.');
    }
    order.address = { street, city, district, ward, country: country || 'Vietnam' };
  }
  if (price !== undefined) {
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Price must be a non-negative number.');
    }
    order.price = price;
    order.total_amount = price;
  }
  if (phone_number) {
    order.phone_number = phone_number;
  }
  if (description) {
    order.description = description;
  }

  // Cập nhật updated_at
  order.updated_at = Date.now();

  // Lưu đơn hàng
  const updatedOrder = await order.save();

  // Populate thông tin technician (nếu có)
  await updatedOrder.populate('technician_id', 'name email phone_number');

  // Ghi log
  const user = await UserModel.findById(userId).lean();
  logger.info(`Order ${orderId} updated by user: ${user.email || user.phone_number} (ID: ${user._id})`);

  return updatedOrder;
}

module.exports = updateOrder;