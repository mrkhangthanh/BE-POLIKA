const { validationResult } = require('express-validator');
const ServiceType = require('../../models/serviceType');
const Order = require('../../models/order');
const pagination = require('../../../../libs/pagination');

const getPublicOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, status, service_type, 'address.city': city } = req.query;
    console.log('Query params for public-orders:', { page, limit, status, service_type, city });

    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    const queryConditions = {
      is_active: true,
    };
    if (status) {
      queryConditions.status = status;
    }
    if (service_type) {
      const serviceType = await ServiceType.findOne({ label: service_type });
      if (!serviceType) {
        console.log(`Service type not found for label: ${service_type}`);
        return res.status(400).json({ error: `Invalid service type: ${service_type}` });
      }
      console.log(`Found service type: ${serviceType.value} (ID: ${serviceType._id})`);
      queryConditions.service_type = serviceType._id;
    }
    if (city) {
      queryConditions['address.city'] = city;
    }

    const populatedOrders = await Order.find(queryConditions)
      .populate('customer_id', 'name')
      .populate('technician_id', 'name')
      .populate('service_type', 'label')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    console.log('Public orders found in controller:', populatedOrders);

    const paginationInfo = await pagination(page, limit, Order, queryConditions);
    console.log('Pagination info for public-orders:', paginationInfo);

    res.status(200).json({
      success: true,
      orders: populatedOrders,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error('Error in getPublicOrders:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = getPublicOrders;