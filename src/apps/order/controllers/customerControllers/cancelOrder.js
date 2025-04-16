const OrderService = require('../../services/orderService');

 const cancelOrder = async (req, res) => {
  try {
    const result = await OrderService.cancelOrder(req.user._id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error in cancelOrder:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = cancelOrder;