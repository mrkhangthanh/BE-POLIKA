const { findTechniciansForOrder } = require('./findTechniciansForOrder');
const { createNotificationMessage } = require('./createNotificationMessage');
const { sendNotifications } = require('./sendNotifications');
const { normalizeCity } = require('../../../../libs/normalizeCity');

async function notifyTechniciansInCity(order, serviceType, debug = false) {
  try {
    console.log('Order address:', order.address);
    console.log('Service type:', { id: serviceType._id, label: serviceType.label });

    // Bước 1: Tìm kiếm technician
    const technicians = await findTechniciansForOrder(order, serviceType, debug);
    if (technicians.length === 0) {
      return;
    }

    // Bước 2: Tạo thông báo
    const normalizedCity = normalizeCity(order.address.city);
    const { title, body } = createNotificationMessage(serviceType, normalizedCity);

    // Bước 3: Gửi thông báo
    await sendNotifications(technicians, title, body, order); // Truyền thêm order
  } catch (error) {
    console.error('Error notifying technicians:', {
      message: error.message,
      stack: error.stack,
    });
  }
}

module.exports = { notifyTechniciansInCity };