const OrderModel = require('../models/order');
const UserModel = require('../../auth/models/user');
const logger = require('../../../libs/logger');
const { PENDING } = require('../../Shared/constants/orderStatuses');

async function createOrder(userId, orderData) {
  try {
    console.log('Starting OrderService.createOrder for user:', userId, 'with data:', orderData);

    const { service_type, description, address, phone_number, price } = orderData;

    const user = await UserModel.findById(userId);
    if (!user) {
      console.error('User not found for ID:', userId);
      throw new Error('User not found.');
    }

    const finalPhoneNumber = phone_number || user.phone_number;
    if (!finalPhoneNumber) {
      console.error('Phone number missing for user:', userId);
      throw new Error('Phone number is required.');
    }

    if (!address || !address.street || !address.city || !address.district || !address.ward) {
      console.error('Invalid address data:', address);
      throw new Error('Address is required.');
    }

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
    console.log('Order saved successfully:', savedOrder._id);

    const updatedUser = await UserModel.findById(userId).select('phone_number address');
    console.log('Fetched updated user:', updatedUser._id);

    logger.info(`Order created for user: ${user.email || user.phone_number} (ID: ${user._id}, Order ID: ${savedOrder._id})`);

    return {
      success: true,
      order: savedOrder.toObject(),
      user: {
        phone_number: updatedUser.phone_number || '',
        address: updatedUser.address || {},
        isFirstOrder: !user.address || !user.address.city,
      },
    };
  } catch (err) {
    console.error('Error in OrderService.createOrder:', {
      message: err.message,
      stack: err.stack,
      userId,
      orderData,
    });
    throw err;
  }
}

module.exports = createOrder;