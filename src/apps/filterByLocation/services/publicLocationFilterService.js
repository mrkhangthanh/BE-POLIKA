const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');

async function filterPublicOrdersByCity(query) {
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', service_type, city } = query;

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const queryConditions = {};

  // Lọc theo service_type nếu có
  if (service_type) {
    queryConditions.service_type = service_type;
  }

  // Lọc theo thành phố nếu có
  if (city) {
    queryConditions['address.city'] = city;
  }

  const orders = await OrderModel.find(queryConditions)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('customer_id', 'name')
    .populate('technician_id', 'name')
    .populate('service_type', 'label')
    .lean();

  const total = await OrderModel.countDocuments(queryConditions);

  logger.info(`Filtered public orders by city: ${city || 'All'}`);

  return { orders, total };
}

module.exports = { filterPublicOrdersByCity };