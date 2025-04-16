
const { validationResult } = require('express-validator');
const OrderService = require('../../services/orderService');
const pagination = require('../../../../libs/pagination');
const Order = require('../../models/order');

const getAllOrders = async (req, res) => {
  try {
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status } = req.query;
    console.log('Query params:', { page, limit, status }); // Log query params

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Không giới hạn bởi customer_id, lấy tất cả đơn hàng
    const queryConditions = {};
    if (status) {
      queryConditions.status = status;
    }

    // Gọi OrderService.getAllOrders để lấy tất cả đơn hàng
    const { orders } = await OrderService.getAllOrders(req.query);


    console.log('Orders found in controller:', orders);

    // Sử dụng queryConditions cho pagination
    const paginationInfo = await pagination(page, limit, Order, queryConditions);

    console.log('Pagination info:', paginationInfo);

    res.status(200).json({
      success: true,
      orders,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = getAllOrders;