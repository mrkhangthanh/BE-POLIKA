const OrderService = require('../../services/orderService');

const getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.user._id, req.params.id);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Error in getOrderById:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = getOrderById;