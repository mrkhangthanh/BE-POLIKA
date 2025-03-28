const UserModel = require('../../auth/models/user');
const OrderModel = require('../../order/models/order');
const pagination = require('../../../libs/pagination');

// Lấy danh sách khách hàng thuộc đại lý
exports.getCustomersByAgent = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Access denied. Only agents can view their customers.' });
    }

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Validation và xử lý sort
    const allowedSortFields = ['name', 'email', 'phone_number', 'created_at'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Điều kiện lọc: khách hàng có referred_by là ID của đại lý
    const query = {
      referred_by: req.user._id,
      role: 'customer',
    };

    // Sử dụng hàm pagination để lấy thông tin phân trang
    const paginationInfo = await pagination(page, limit, UserModel, query);

    // Lấy danh sách khách hàng
    const customers = await UserModel.find(query)
      .select('name email phone_number created_at')
      .sort(sort)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    res.status(200).json({ success: true, customers, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách đơn hàng của khách hàng thuộc đại lý (có phân trang)
exports.getOrdersByAgentCustomers = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Access denied. Only agents can view orders of their customers.' });
    }

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Validation và xử lý sort
    const allowedSortFields = ['created_at', 'service_type', 'status'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }

    // Lấy danh sách khách hàng thuộc đại lý
    const customers = await UserModel.find({
      referred_by: req.user._id,
      role: 'customer',
    }).select('_id').lean();

    const customerIds = customers.map(customer => customer._id);

    // [Cải thiện 5.3] Sử dụng aggregation để tối ưu truy vấn
    const pipeline = [
      // Lọc đơn hàng của các khách hàng thuộc đại lý
      {
        $match: {
          customer_id: { $in: customerIds },
        },
      },
      // Join với collection users để lấy thông tin customer
      {
        $lookup: {
          from: 'users',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_id',
        },
      },
      {
        $unwind: '$customer_id',
      },
      {
        $project: {
          'customer_id.name': 1,
          service_type: 1,
          description: 1,
          status: 1,
          price: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
      // Sắp xếp
      {
        $sort: {
          [sortBy]: sortOrder === 'desc' ? -1 : 1,
        },
      },
    ];

    // Tính tổng số bản ghi
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await OrderModel.aggregate(totalPipeline);
    const totalOrders = totalResult.length > 0 ? totalResult[0].total : 0;

    // Tính phân trang thủ công vì aggregation không dùng pagination.js
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const totalPages = Math.ceil(totalOrders / limitInt);
    const paginationInfo = {
      totalRows: totalOrders,
      totalPages,
      currentPage: pageInt,
      pageSize: limitInt,
      next: pageInt + 1,
      prev: pageInt - 1,
      hasNext: pageInt < totalPages,
      hasPrev: pageInt > 1,
    };

    // Áp dụng phân trang
    pipeline.push(
      { $skip: (pageInt - 1) * limitInt },
      { $limit: limitInt }
    );

    // Thực hiện aggregation để lấy danh sách đơn hàng
    const orders = await OrderModel.aggregate(pipeline);

    res.status(200).json({ success: true, totalOrders, orders, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Thêm hàm getCommission hoa hồng
exports.getCommission = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Lấy danh sách khách hàng thuộc đại lý
    const customers = await UserModel.find({ agent_id: req.user._id, role: 'customer' }).select('_id');
    const customerIds = customers.map(customer => customer._id);

    // Tạo query để lấy đơn hàng
    const query = {
      customer_id: { $in: customerIds },
      status: 'completed', // Chỉ tính doanh thu từ đơn hàng đã hoàn thành
    };

    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    // Tính tổng doanh thu
    const orders = await OrderModel.find(query).lean();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Lấy tỷ lệ hoa hồng của đại lý
    const agent = await UserModel.findById(req.user._id).select('commission');
    const commissionRate = agent.commission || 0;

    // Tính hoa hồng
    const commission = totalRevenue * commissionRate;

    // Trả về kết quả
    res.status(200).json({
      success: true,
      totalRevenue,
      commissionRate,
      commission,
      totalOrders: orders.length,
    });
  } catch (err) {
    logger.error(`Get commission error: ${err.message}`);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ', details: err.message });
  }
};