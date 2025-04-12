const OrderModel = require('../../order/models/order');
const { PENDING, ACCEPTED, CANCELLED, COMPLETED } = require('../../Shared/constants/orderStatuses');

async function rejectOrder(technicianId, orderId) {
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
  module.exports = rejectOrder;