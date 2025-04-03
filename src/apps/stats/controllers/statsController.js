// src/apps/auth/controllers/statsController.js
const User = require('../../auth/models/user');
const Order = require('../../order/models/order'); // Giả sử bạn có model Order

exports.getStats = async (req, res) => {
    try {
      // Thống kê người dùng mới (theo tháng)
      const newUsers = await User.aggregate([
        {
          $group: {
            _id: { $month: '$created_at' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]);
  
      // Thống kê đơn hàng hoàn thành (theo tháng)
      const completedOrders = await Order.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: { $month: '$created_at' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]);
  
      // Tính tổng doanh thu
      const totalRevenueResult = await Order.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$total_amount' }, // Giả sử Order có trường total_amount
          },
        },
      ]);
      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
  
      // Tính tổng đơn hàng
      const totalOrders = await Order.countDocuments();
  
      // Tính tỷ lệ hoàn thành đơn hàng
      const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
      const completionRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0;
  
      // Chuẩn hóa dữ liệu cho 6 tháng gần nhất
      const months = [1, 2, 3, 4, 5, 6];
      const newUsersData = months.map((month) => {
        const found = newUsers.find((item) => item._id === month);
        return found ? found.count : 0;
      });
      const completedOrdersData = months.map((month) => {
        const found = completedOrders.find((item) => item._id === month);
        return found ? found.count : 0;
      });
  
      res.status(200).json({
        success: true,
        data: {
          newUsers: newUsersData,
          completedOrders: completedOrdersData,
          totalRevenue,
          totalOrders,
          completionRate: completionRate.toFixed(2), // Làm tròn 2 chữ số
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Không thể lấy thống kê.', error: err.message });
    }
  };