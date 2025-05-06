// controllers/userController.js
const mongoose = require('mongoose');
const User = require('../../auth/models/user'); // Đường dẫn đến model User

// Lấy danh sách admin/manager
const getAdmins = async (req, res) => {
    try {
      console.log('Entering getAdmins controller');
      const admins = await User.find(
        { role: { $in: ['admin', 'manager'] } }, // Lọc người dùng có role là admin hoặc manager
        '_id name role' // Chỉ lấy các trường cần thiết
      ).lean();
  
      if (!admins || admins.length === 0) {
        console.log('No admins or managers found');
        return res.status(404).json({ message: 'Không tìm thấy admin hoặc manager' });
      }
  
      console.log('Admins found:', admins);
      res.status(200).json({ data: admins });
    } catch (err) {
      console.error('Error in getAdmins:', err);
      res.status(500).json({ message: err.message });
    }
  };
  
  module.exports = { getAdmins };