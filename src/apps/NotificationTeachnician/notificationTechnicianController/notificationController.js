const Notification = require('../models/notification');

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
    console.error('Error fetching notifications:', error);
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
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

module.exports = { getUnreadNotifications, markNotificationAsRead };