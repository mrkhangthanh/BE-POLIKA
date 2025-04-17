const UserModel = require('../../auth/models/user');
const OrderModel = require('../../order/models/order');
const logger = require('../../../libs/logger');
const { CUSTOMER_SORT_FIELDS, VALID_SORT_ORDERS } = require('../../Shared/constants/sortFields');

async function getCustomerOrders(userId, query) {
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', status, populate = [] } = query;

  // Kiểm tra sortBy và sortOrder
  if (!CUSTOMER_SORT_FIELDS.includes(sortBy)) {
    throw new Error(`SortBy must be one of: ${CUSTOMER_SORT_FIELDS.join(', ')}`);
  }
  if (!VALID_SORT_ORDERS.includes(sortOrder)) {
    throw new Error('SortOrder must be "asc" or "desc".');
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const queryConditions = { customer_id: userId };
  if (status) {
    queryConditions.status = status;
  }

  let orderQuery = OrderModel.find(queryConditions)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // Áp dụng populate nếu có
  if (populate && Array.isArray(populate)) {
    populate.forEach((pop) => {
      orderQuery = orderQuery.populate(pop.path, pop.select);
    });
  }

  const orders = await orderQuery;

  const user = await UserModel.findById(userId).lean();
  const ordersWithCustomerInfo = orders.map(order => ({
    ...order,
    customer_phone_number: user.phone_number,
  }));

  logger.info(`Customer ${user.email || user.phone_number} (ID: ${user._id}) viewed their orders.`);

  return { orders: ordersWithCustomerInfo };
}

module.exports = getCustomerOrders;