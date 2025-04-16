const { validationResult } = require('express-validator');
const OrderService = require('../../services/orderService');

const updateOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await OrderService.updateOrder(req.user._id, req.params.id, req.body);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Error in updateOrder:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = updateOrder;