const OrderModel = require('../../order/models/order');
const { PENDING, ACCEPTED, CANCELLED, COMPLETED } = require('../../Shared/constants/orderStatuses');
const { CUSTOMER_SORT_FIELDS, TECHNICIAN_SORT_FIELDS, VALID_SORT_ORDERS } = require('../../Shared/constants/sortFields');

async function getOrdersForTechnician(technician, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = query;

    // Kiểm tra sortBy và sortOrder
    if (!TECHNICIAN_SORT_FIELDS.includes(sortBy)) {
      throw new Error(`SortBy must be one of: ${TECHNICIAN_SORT_FIELDS.join(', ')}`);
    }
    if (!VALID_SORT_ORDERS.includes(sortOrder)) {
      throw new Error('SortOrder must be "asc" or "desc".');
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const queryConditions = {
      service_type: { $in: technician.specialization },
      status: PENDING,
      technician_id: null,
    };

    const orders = await OrderModel.find(queryConditions)
      .populate('customer_id', 'name email phone_number')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    return { orders, total: await OrderModel.countDocuments(queryConditions) };
  };
  module.exports = getOrdersForTechnician;