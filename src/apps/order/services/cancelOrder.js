const UserModel = require('../../auth/models/user');
const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');
const { PENDING, CANCELLED } = require('../../Shared/constants/orderStatuses');


// Hủy đơn hàng
async function cancelOrder(userId, orderId) {
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

  module.exports = cancelOrder;