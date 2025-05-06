const { sendPushNotification } = require('../../../../../firebase');
const Notification = require('../../../NotificationTeachnician/models/notification');

async function sendNotifications(technicians, notificationTitle, notificationBody, order) {
  try {
    const notificationPromises = technicians.map(async (technician) => {
      // Lưu thông báo vào DB
      await Notification.create({
        user_id: technician._id,
        order_id: order._id,
        message: notificationBody,
        type: 'new_order',
        is_read: false,
        created_at: new Date(),
      });

      if (technician.fcmToken) {
        console.log(`Preparing to send notification to technician ${technician.name} (ID: ${technician._id}) in ${technician.address.city}`);
        try {
          await sendPushNotification(
            technician.fcmToken,
            notificationTitle,
            notificationBody
          );
          console.log(`Đã gửi thông báo thành công đến thợ ${technician.name} (ID: ${technician._id}) ở ${technician.address.city}`);
        } catch (notificationError) {
          console.error(
            `Failed to send notification to technician ${technician._id}:`,
            {
              message: notificationError.message,
              code: notificationError.code || 'N/A',
              fcmToken: technician.fcmToken,
            }
          );
        }
      } else {
        console.log(`Thợ ${technician.name} (ID: ${technician._id}) ở ${technician.address.city} không có FCM token.`);
      }
    });

    await Promise.all(notificationPromises);
    console.log('Completed sending notifications to all technicians.');
  } catch (error) {
    console.error('Error sending notifications:', {
      message: error.message,
      stack: error.stack,
    });
  }
}

module.exports = { sendNotifications };