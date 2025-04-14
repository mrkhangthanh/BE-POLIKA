const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');

async function getOrderById(userId, orderId) {
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
  };
  module.exports = getOrderById;
