const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const OrderService = require('../../services/orderService');
const NotificationService = require('../../services/notification/notificationService');
const ServiceType = require('../../../order/models/serviceType');
const Order = require('../../models/order');
const User = require('../../../auth/models/user');
const { normalizeCity } = require('../../../../libs/normalizeCity');

const createOrder = async (req, res) => {
  try {
    // console.log('Starting createOrder for user:', req.user._id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // console.log('Order data received:', req.body);

    const { service_type, description, address, phone_number, price } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!service_type) {
      // console.log('Missing service_type in request body');
      return res.status(400).json({ error: 'Service type is required.' });
    }
    if (!description) {
      // console.log('Missing description in request body');
      return res.status(400).json({ error: 'Description is required.' });
    }
    if (!address || !address.city || !address.street || !address.district || !address.ward || !address.country) {
      // console.log('Missing address or address fields in request body');
      return res.status(400).json({ error: 'All address fields (street, city, district, ward, country) are required.' });
    }
    if (!phone_number || !/^\d{10}$/.test(phone_number)) {
      // console.log('Invalid phone_number in request body');
      return res.status(400).json({ error: 'Phone number must be 10 digits.' });
    }
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      // console.log('Invalid price in request body');
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }

    const serviceType = await ServiceType.findOne({ value: service_type }).lean();
    if (!serviceType) {
      // console.log(`Service type not found for value: ${service_type}`);
      return res.status(400).json({ error: `Invalid service type: ${service_type}. Must match a valid service type in the database.` });
    }
    // console.log(`Found service type: ${serviceType.label} (ID: ${serviceType._id})`);

    // Kiểm tra đơn hàng trùng lặp
    const normalizedCityName = normalizeCity(address.city);
    const recentOrder = await Order.findOne({
      customer_id: req.user._id,
      service_type: serviceType._id,
      status: { $in: ['pending', 'processing'] },
      'address.city': normalizedCityName,
      created_at: { $gte: new Date(Date.now() - 1 * 60 * 1000) },
    });
    if (recentOrder) {
      // console.log('Found duplicate order:', {
      //   order_id: recentOrder._id,
      //   customer_id: recentOrder.customer_id,
      //   service_type: recentOrder.service_type,
      //   status: recentOrder.status,
      //   city: recentOrder.address.city,
      //   created_at: recentOrder.created_at,
      // });
      return res.status(400).json({
        error: 'Đơn hàng tương tự mới được tạo. Vui lòng vào danh sách đơn để sửa. Hoặc chờ sau 1 phút.',
        duplicate_order: {
          order_id: recentOrder._id,
          created_at: recentOrder.created_at,
          status: recentOrder.status,
        },
      });
    }

    const normalizedAddress = {
      street: address.street,
      city: normalizedCityName,
      district: address.district,
      ward: address.ward,
      country: address.country,
    };

    const orderData = {
      service_type: serviceType._id,
      description,
      address: normalizedAddress,
      phone_number,
      price: parseFloat(price),
      customer_id: req.user._id,
    };

    // console.log('Normalized order data:', orderData);

    // Gọi OrderService.createOrder
    const result = await OrderService.createOrder(req.user._id, orderData);
    if (!result || !result.success || !result.order) {
      // console.error('Order creation failed or invalid result:', result);
      return res.status(400).json({ error: 'Failed to create order: Invalid order data' });
    }

    const order = result.order;
    // console.log(`Order created successfully: ${order._id}`);

    // Cập nhật address của user nếu cần
    const user = await User.findById(req.user._id);
    let isFirstOrder = false;
    if (!user.address || !user.address.city) {
      try {
        const updateResult = await User.updateOne(
          { _id: req.user._id },
          {
            $set: {
              address: normalizedAddress,
              phone_number: phone_number || user.phone_number,
            },
          }
        );
        if (updateResult.matchedCount === 0) {
          // console.error('No user matched for address update:', req.user._id);
          return res.status(500).json({ error: 'Failed to update user address: User not found' });
        }
        if (updateResult.modifiedCount === 0) {
          // console.warn('User address not modified:', req.user._id, normalizedAddress);
        } else {
          console.log('Updated user address for first order:', normalizedAddress);
        }
        isFirstOrder = true;
      } catch (updateErr) {
        console.error('Failed to update user address:', {
          message: updateErr.message,
          stack: updateErr.stack,
          userId: req.user._id,
          address: normalizedAddress,
        });
        return res.status(500).json({ error: 'Failed to update user address', details: updateErr.message });
      }
    }

    res.status(201).json({
      success: true,
      order,
      user: {
        phone_number: phone_number || user.phone_number,
        address: isFirstOrder ? normalizedAddress : user.address,
        isFirstOrder,
      },
    });

    setImmediate(async () => {
      try {
        // console.log('Sending notification for order:', order._id, 'with city:', order.address.city);
        await NotificationService.notifyTechniciansInCity(order, serviceType);

        if (req.io) {
          const updatedOrders = await Order.find()
            .populate('customer_id', 'name')
            .populate('technician_id', 'name')
            .populate('service_type', 'label')
            .sort({ created_at: -1 })
            .limit(50)
            .lean();
          // console.log('Sending order_update event with orders:', updatedOrders.length);
          req.io.emit('order_update', updatedOrders);
        } else {
          console.error('Socket.IO instance (req.io) is not available.');
        }
      } catch (err) {
        console.error('Error in background tasks:', err.stack);
      }
    });
  } catch (err) {
    console.error('Error in createOrder:', {
      message: err.message,
      stack: err.stack,
      orderData: req.body,
    });
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = createOrder;