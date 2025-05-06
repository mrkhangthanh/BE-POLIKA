const Notification = require('../../NotificationTeachnician/models/notification');
const User = require('../../auth/models/user'); // Giả định bạn có model User

const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy từ middleware auth
    const notifications = await Notification.find({
      user_id: userId,
    }) // Lấy tất cả thông báo, không lọc is_read
      .populate('order_id', 'service_type address.city')
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications for customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.updateOne(
      { _id: notificationId, user_id: req.user._id },
      { $set: { is_read: true } }
    );
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read for customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

// Hàm tạo thông báo khi technician chấp nhận đơn
const createOrderAcceptedNotification = async (order, technician) => {
  try {
    const customerId = order.customer_id; // Giả định order có trường customer_id
    const message = `Thợ ${technician.name} đã nhận đơn, đang trong quá trình đến xử lý.`;
    
    const notification = new Notification({
      user_id: customerId,
      message: message,
      order_id: order._id,
      type: 'order_accepted',
      is_read: false,
    });

    await notification.save();
    console.log('Notification created for customer:', notification);
  } catch (error) {
    console.error('Error creating notification for customer:', error);
  }
};

module.exports = {
  getUnreadNotifications,
  markNotificationAsRead,
  createOrderAcceptedNotification,
};