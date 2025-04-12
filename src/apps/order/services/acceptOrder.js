const OrderModel = require('../../order/models/order');
const { PENDING, ACCEPTED, } = require('../../Shared/constants/orderStatuses');

// Nhận đơn hàng
 async function acceptOrder(technician, orderId, price) {
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

  module.exports = acceptOrder;