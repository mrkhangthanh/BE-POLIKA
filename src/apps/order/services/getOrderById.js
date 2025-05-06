const OrderModel = require('../../order/models/order');
const UserModel = require('../../auth/models/user'); // Import UserModel để lấy customer_name
const ServiceTypeModel = require('../models/serviceType'); // Import ServiceTypeModel để lấy service_type_name
const logger = require('../../../libs/logger');
const mongoose = require('mongoose'); // Thêm mongoose để xử lý ObjectId


async function getOrderById(user, orderId) {
    // Kiểm tra user có phải là object không
    if (!user || typeof user !== 'object' || !user._id || !user.role) {
      throw new Error('Invalid user data.');
    }

    // console.log('User:', user); // Log user để debug
    // console.log('Order ID:', orderId); // Log orderId để debug

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    // console.log('Order:', order); // Log order để debug
    // console.log('Order Customer ID:', order.customer_id?.toString()); // Log customer_id
    // console.log('Order Technician ID:', order.technician_id?.toString()); // Log technician_id
    // console.log('User ID:', user._id?.toString()); // Log user._id

    // Lấy tên khách hàng từ customer_id
    // console.log('Finding customer with ID:', order.customer_id);
    const customer = await UserModel.findById(order.customer_id);
    // console.log('Customer found:', customer);

    // Lấy tên loại dịch vụ từ service_type
    // console.log('Finding service with ID:', order.service_type);
    const service = await ServiceTypeModel.findById(order.service_type);
    // console.log('Service found:', service);

    // Tạo plain object để trả về, đảm bảo bao gồm các trường động
    const orderData = order.toJSON(); // Chuyển đổi thành plain object
    orderData.customer_name = customer ? customer.name : 'N/A'; // Thêm customer_name
    orderData.service_type_name = service ? service.label : 'N/A'; // Thêm service_type_name
    // console.log('Order Data to Return:', orderData); // Log dữ liệu cuối cùng trước khi trả về

    // Nếu user là admin, cho phép xem tất cả đơn hàng
    if (user.role === 'admin') {
      // console.log('User is admin, allowing access to all orders.');
      return orderData;
    }

    // Nếu user là technician, cho phép xem tất cả đơn hàng
    if (user.role === 'technician') {
      // console.log('User is technician, allowing access to view the order.');
      return orderData;
    }

    // Kiểm tra quyền truy cập cho customer
    if (order.customer_id.toString() !== user._id.toString()) {
      let errorMessage = 'Access denied. You can only view your own orders.';
      if (user.role === 'customer') {
        errorMessage += ` Customer ID (${user._id}) does not match order's customer_id (${order.customer_id.toString()}).`;
      }
      throw new Error(errorMessage);
    }

    return orderData;
};

module.exports = getOrderById;