const nodemailer = require('nodemailer');
const config = require('config');

// Cấu hình transporter cho nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.get('mail.user'),
    pass: config.get('mail.pass'),
  },
});

// Gửi email thay đổi trạng thái (đã có sẵn)
exports.sendStatusChangeEmail = async (user, status, reason) => {
  const mailOptions = {
    from: config.get('mail.user'),
    to: user.email,
    subject: `Account Status Changed to ${status}`,
    text: `Dear ${user.name || 'User'},\n\nYour account status has been changed to "${status}".\nReason: ${reason}\n\nBest regards,\nPolika Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status change email sent to ${user.email}`);
  } catch (err) {
    console.error(`Failed to send status change email to ${user.email}: ${err.message}`);
    throw err;
  }
};

// Gửi email thông báo đơn hàng mới cho technician
exports.sendNewOrderNotification = async (technician, order) => {
  const mailOptions = {
    from: config.get('mail.user'),
    to: technician.email,
    subject: `New Order Available: ${order.service_type}`,
    text: `Dear ${technician.name || 'Technician'},\n\nA new order is available for you:\n- Service Type: ${order.service_type}\n- Description: ${order.description}\n- Address: ${order.address.street}, ${order.address.ward}, ${order.address.district}, ${order.address.city}, ${order.address.country}\n\nPlease check your dashboard to accept the order.\n\nBest regards,\nPolika Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`New order notification sent to ${technician.email}`);
  } catch (err) {
    console.error(`Failed to send new order notification to ${technician.email}: ${err.message}`);
    throw err;
  }
};