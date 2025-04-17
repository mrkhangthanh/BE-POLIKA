const { validationResult } = require('express-validator');
const OrderService = require('../../services/orderService');
const pagination = require('../../../../libs/pagination');
const Order = require('../../models/order');

const getCustomerOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status } = req.query;

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    const filter = { customer_id: req.user._id }; // Sửa "user" thành "customer_id"
    if (status) {
      filter.status = status;
    }

    // Gọi OrderService.getCustomerOrders với populate để lấy label của service_type
    const { orders } = await OrderService.getCustomerOrders(req.user._id, {
      ...req.query,
      populate: [
        { path: 'customer_id', select: 'name' },
        { path: 'technician_id', select: 'name' },
        { path: 'service_type', select: 'label' }, // Populate service_type để lấy label
      ],
    });

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

module.exports = getCustomerOrders;