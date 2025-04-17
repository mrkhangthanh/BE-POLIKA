const { validationResult } = require('express-validator');
const OrderService = require('../../services/orderService');
const ServiceType = require('../../../order/models/serviceType');
const UserModel = require('../../../auth/models/user');
const { sendPushNotification } = require('../../../../../firebase');
const Order = require('../../models/order');

const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // console.log('Received Order Data in createOrder:', JSON.stringify(req.body, null, 2));

    const { service_type, description, address, phone_number, price } = req.body;

    if (!service_type) {
      return res.status(400).json({ error: 'Service type is required.' });
    }

    const serviceType = await ServiceType.findOne({ value: service_type }).lean();
    if (!serviceType) {
      console.log(`Service type not found for value: ${service_type}`);
      return res.status(400).json({ error: `Invalid service type: ${service_type}. Must match a valid service type in the database.` });
    }
    console.log(`Found service type: ${serviceType.label} (ID: ${serviceType._id})`);

    // Kiểm tra đơn hàng trùng lặp
    const recentOrder = await Order.findOne({
      customer_id: req.user._id,
      service_type: serviceType._id,
      created_at: { $gte: new Date(Date.now() - 3 * 60 * 1000) }, // Trong 3 phút gần đây
    });

    if (recentOrder) {
      return res.status(400).json({ error: 'Đơn hàng tương tự mới được tạo. Vui lòng vào danh sách đơn để sửa. Hoặc chờ sau 3 phút .' });
    }

    const orderData = {
      ...req.body,
      service_type: serviceType._id,
    };

    // console.log(`Creating order for user ${req.user._id} with data:`, orderData);
    const order = await OrderService.createOrder(req.user._id, orderData);
    // console.log(`Order created successfully: ${order._id}`);

    // Trả về response ngay lập tức
    res.status(201).json({ success: true, order });

    // Xử lý gửi thông báo và Socket.IO bất đồng bộ
    setImmediate(async () => {
      try {
        const technicians = await UserModel.find({
          role: 'technician',
          services: serviceType._id,
        })
          .select('name fcmToken')
          .lean();

        // console.log(`Found ${technicians.length} technicians for service type ${serviceType.label}`);

        const notificationTitle = 'Đơn hàng mới!';
        const notificationBody = `Một đơn hàng mới trong lĩnh vực ${serviceType.label} vừa được tạo. Kiểm tra ngay!`;

        const notificationPromises = technicians.map((technician) => {
          if (technician.fcmToken) {
            return sendPushNotification(
              technician.fcmToken,
              notificationTitle,
              notificationBody
            )
              .then(() => {
                console.log(`Đã gửi thông báo đến thợ ${technician.name} (ID: ${technician._id})`);
              })
              .catch((notificationError) => {
                console.error(`Failed to send notification to technician ${technician._id}:`, notificationError);
              });
          } else {
            console.log(`Thợ ${technician.name} (ID: ${technician._id}) không có FCM token.`);
            return Promise.resolve();
          }
        });

        await Promise.all(notificationPromises);

        if (req.io) {
          const updatedOrders = await Order.find()
            .populate('customer_id', 'name')
            .populate('technician_id', 'name')
            .populate('service_type', 'label')
            .sort({created_at: -1 })
            .limit(50)
            .lean();
          // console.log('Sending order_update event with orders:', updatedOrders.length);
          req.io.emit('order_update', updatedOrders);
        } else {
          console.error('Socket.IO instance (req.io) is not available.');
        }
      } catch (err) {
        console.error('Error in background tasks:', err);
      }
    });
  } catch (err) {
    console.error('Error in createOrder:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = createOrder;