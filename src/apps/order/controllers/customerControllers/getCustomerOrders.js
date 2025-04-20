const { validationResult } = require('express-validator');
const OrderService = require('../../services/orderService');
const pagination = require('../../../../libs/pagination');
const Order = require('../../models/order');

const getCustomerOrders = async (req, res) => {
  try {
    // Bỏ qua validation tạm thời để debug
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   console.log('Validation errors in getCustomerOrders:', errors.array());
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const { page = 1, limit = 10, status, recent_minutes } = req.query;

    if (isNaN(page) || isNaN(limit)) {
      console.log('Invalid page or limit:', { page, limit });
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      console.log('Limit exceeds 100:', limit);
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }
    if (recent_minutes && (isNaN(recent_minutes) || parseInt(recent_minutes) <= 0)) {
      console.log('Invalid recent_minutes:', recent_minutes);
      return res.status(400).json({ error: 'recent_minutes must be a positive number.' });
    }

    const filter = { customer_id: req.user._id };
    if (status) {
      // Xử lý status là chuỗi danh sách hoặc mảng
      let statusArray;
      if (typeof status === 'string') {
        statusArray = status.split(',').map((s) => s.trim());
      } else if (Array.isArray(status)) {
        statusArray = status;
      } else {
        statusArray = [status];
      }
      filter.status = { $in: statusArray };
    }
    if (recent_minutes) {
      filter.created_at = { $gte: new Date(Date.now() - parseInt(recent_minutes) * 60 * 1000) };
    }

    console.log('Query filter for getCustomerOrders:', filter);

    // Gọi OrderService.getCustomerOrders với populate
    const { orders } = await OrderService.getCustomerOrders(req.user._id, {
      ...req.query,
      populate: [
        { path: 'customer_id', select: 'name' },
        { path: 'technician_id', select: 'name' },
        { path: 'service_type', select: 'label value' },
      ],
    });

    const paginationInfo = await pagination(page, limit, Order, filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error('Error in getCustomerOrders:', {
      message: err.message,
      stack: err.stack,
      query: req.query,
    });
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = getCustomerOrders;