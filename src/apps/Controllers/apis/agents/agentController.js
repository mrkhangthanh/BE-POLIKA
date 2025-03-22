const UserModel = require('../../../models/user')

// Lấy danh sách khách hàng thuộc đại lý
exports.getCustomersByAgent = async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ error: 'Access denied. Only agents can view their customers.' });
      }
  
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
  
      // Lấy danh sách khách hàng có referred_by là ID của đại lý
      const customers = await UserModel.find({
        referred_by: req.user._id,
        role: 'customer',
      })
        .select('name email phone_number created_at') // Chỉ lấy các thông tin cơ bản
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
  
      const total = await UserModel.countDocuments({
        referred_by: req.user._id,
        role: 'customer',
      });
  
      const pagination = {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        next: page * limit < total ? parseInt(page) + 1 : null,
        prev: page > 1 ? parseInt(page) - 1 : null,
      };
  
      res.status(200).json({ success: true, customers, pagination });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  };
  
  // Lấy tổng số đơn hàng của khách hàng thuộc đại lý
  exports.getOrdersByAgentCustomers = async (req, res) => {
    try {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ error: 'Access denied. Only agents can view orders of their customers.' });
      }
  
      // Lấy danh sách khách hàng thuộc đại lý
      const customers = await UserModel.find({
        referred_by: req.user._id,
        role: 'customer',
      }).select('_id').lean();
  
      const customerIds = customers.map(customer => customer._id);
  
      // Lấy danh sách đơn hàng của các khách hàng này
      const orders = await OrderModel.find({
        customer_id: { $in: customerIds },
      })
        .populate('customer_id', 'name')
        .lean();
  
      const totalOrders = orders.length;
  
      res.status(200).json({ success: true, totalOrders, orders });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  };