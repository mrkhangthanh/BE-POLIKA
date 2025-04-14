const OrderModel = require('../models/order');
const UserModel = require('../../auth/models/user');
const logger = require('../../../libs/logger');
const { PENDING } = require('../../Shared/constants/orderStatuses');
const { VALID_SERVICE_TYPES } = require('../../Shared/constants/serviceTypes');
const { updateUserProfile } = require('../../auth/controllers/authController');

async function createOrder(userId, orderData) {
  const { service_type, description, address, phone_number, price } = orderData;

  // Kiểm tra loại dịch vụ
//   if (!VALID_SERVICE_TYPES.includes(service_type)) {
//     throw new Error(`Invalid service type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}`);
//   }

  // Tìm user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  // Sử dụng số điện thoại từ UserModel nếu không có phone_number trong orderData
  const finalPhoneNumber = phone_number || user.phone_number;
  if (!finalPhoneNumber) {
    throw new Error('Phone number is required.');
  }

  // Kiểm tra address
  if (!address || !address.street || !address.city || !address.district || !address.ward) {
    throw new Error('Address is required.');
  }

  // Kiểm tra xem user đã có địa chỉ chưa
  const isAddressEmpty = !user.address || !user.address.street || !user.address.city || !user.address.district || !user.address.ward;

  // Tạo đơn hàng
  const newOrder = new OrderModel({
    customer_id: userId,
    service_type,
    description,
    price,
    address: {
      street: address.street,
      city: address.city,
      district: address.district,
      ward: address.ward,
      country: address.country || 'Vietnam',
    },
    phone_number: finalPhoneNumber,
    status: PENDING,
  });

  const savedOrder = await newOrder.save();

  // Nếu user chưa có địa chỉ, gọi updateUserProfile để cập nhật
  if (isAddressEmpty) {
    const updateData = {
      address: {
        street: address.street,
        city: address.city,
        district: address.district,
        ward: address.ward,
        country: address.country || 'Vietnam',
      },
    };

    const updateResult = await updateUserProfile(userId, updateData);

    if (!updateResult.success) {
      throw new Error('Failed to update user profile.');
    }

    logger.info(`Address updated for user: ${user.email || user.phone_number} (ID: ${user._id}) after creating first order`);
  }

  // Lấy thông tin user mới nhất sau khi cập nhật
  const updatedUser = await UserModel.findById(userId).select('phone_number address');

  logger.info(`Order created for user: ${user.email || user.phone_number} (ID: ${user._id}, Order ID: ${savedOrder._id})`);

  return {
    success: true,
    order: savedOrder.toObject(),
    user: {
      phone_number: updatedUser.phone_number || '',
      address: updatedUser.address || {},
      isFirstOrder: isAddressEmpty,
    },
  };
}

module.exports = createOrder;