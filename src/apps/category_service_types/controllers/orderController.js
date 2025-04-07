const serviceTypes = require('../serviceTypes');

// Tạo đơn hàng (đã có sẵn trong code của bạn)
const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    // Logic tạo đơn hàng (giả sử bạn đã có)
    // Ví dụ: Lưu vào database
    res.status(201).json({ message: 'Đơn hàng đã được tạo', data: orderData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// API mới: Lấy danh sách service_types
const getCategoryService = async (req, res) => {
  try {
    res.status(200).json({ service_types: serviceTypes });
  } catch (error) {
    res.status(500).json({ message: 'Không thể lấy danh sách dịch vụ', error: error.message });
  }
};

module.exports = {
  createOrder,
  getCategoryService,
};