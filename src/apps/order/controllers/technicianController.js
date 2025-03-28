const { validationResult } = require('express-validator');
const OrderService = require('../services/orderService');
const pagination = require('../../../libs/pagination');

exports.getOrdersForTechnician = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can view orders.' });
    }

    const { page = 1, limit = 10 } = req.query;

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    const { orders, total } = await OrderService.getOrdersForTechnician(req.user, req.query);
    const paginationInfo = await pagination(page, limit, total);

    res.status(200).json({ success: true, orders, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can accept orders.' });
    }

    const order = await OrderService.acceptOrder(req.user, req.params.id, req.body.price);
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can reject orders.' });
    }

    const order = await OrderService.rejectOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ error: 'Access denied. Only technicians can complete orders.' });
    }

    const result = await OrderService.completeOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.user._id, req.params.id);
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};