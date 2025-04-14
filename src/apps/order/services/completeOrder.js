const UserModel = require('../../auth/models/user');
const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');
const { PENDING, ACCEPTED, CANCELLED, COMPLETED } = require('../../Shared/constants/orderStatuses');

async function completeOrder(technicianId, orderId) {
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
  module.exports = completeOrder;