const OrderService = require('../../services/orderService');

const getOrderById = async (req, res) => {
  try {
    console.log('User Role:', req.user.role); 
    console.log('User ID:', req.user._id); 
    const order = await OrderService.getOrderById(req.user, req.params.id); // Truyền req.user thay vì req.user._id
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Error in getOrderById:', err);
    if (err.message === 'Order not found.') {
      return res.status(404).json({ error: 'Order not found.', details: err.message });
    }
    if (err.message === 'Access denied. You can only view your own orders.') {
      return res.status(403).json({ error: 'Access denied.', details: err.message });
    }
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = getOrderById;