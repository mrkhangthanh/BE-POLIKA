const UserModel = require('../../auth/models/user');
const { sendPushNotification } = require('../../../../firebase');
const { normalizeCity } = require('../../../libs/normalizeCity'); // Thêm import

async function notifyTechniciansInCity(order, serviceType) {
  try {
    console.log('Order address:', order.address);
    console.log('Service type:', { id: serviceType._id, label: serviceType.label });

    // Chuẩn hóa city trước khi truy vấn
    const normalizedCity = normalizeCity(order.address.city);
    console.log('Normalized city for query:', normalizedCity);

    // Log tất cả technician để kiểm tra database
    const allTechnicians = await UserModel.find({ role: 'technician' })
      .select('name address.city services fcmToken')
      .lean();
    console.log('All technicians in database:', allTechnicians.map(t => ({
      _id: t._id,
      name: t.name,
      city: t.address.city,
      services: t.services
    })));

    // Kiểm tra từng điều kiện riêng lẻ
    const techniciansByRole = await UserModel.find({ role: 'technician' })
      .select('name')
      .lean();
    console.log('Technicians with role=technician:', techniciansByRole.length);

    const techniciansByService = await UserModel.find({
      role: 'technician',
      services: serviceType._id
    })
      .select('name services')
      .lean();
    console.log(`Technicians with service ${serviceType._id}:`, techniciansByService.length);

    const techniciansByCity = await UserModel.find({
      role: 'technician',
      'address.city': { $regex: `^${normalizedCity}$`, $options: 'i' } // Không phân biệt hoa/thường
    })
      .select('name address.city')
      .lean();
    console.log(`Technicians in city ${normalizedCity}:`, techniciansByCity.length);

    const technicians = await UserModel.find({
      role: 'technician',
      services: serviceType._id,
      'address.city': { $regex: `^${normalizedCity}$`, $options: 'i' } // Không phân biệt hoa/thường
    })
      .select('name fcmToken address.city')
      .lean();

    console.log(`Found ${technicians.length} technicians in ${normalizedCity} for service type ${serviceType.label}`);
    console.log('Technicians found:', technicians.map(t => ({
      _id: t._id,
      name: t.name,
      city: t.address.city,
      fcmToken: t.fcmToken ? 'Has token' : 'No token'
    })));

    if (technicians.length === 0) {
      console.log('No technicians found. Check conditions:', {
        role: 'technician',
        serviceId: serviceType._id,
        city: normalizedCity
      });
      return;
    }

    const notificationTitle = 'Đơn hàng mới!';
    const notificationBody = `Một đơn hàng mới trong lĩnh vực ${serviceType.label} vừa được tạo tại ${normalizedCity}. Kiểm tra ngay!`;

    const notificationPromises = technicians.map((technician) => {
      if (technician.fcmToken) {
        console.log(`Sending notification to technician ${technician.name} (ID: ${technician._id}) in ${technician.address.city}`);
        return sendPushNotification(
          technician.fcmToken,
          notificationTitle,
          notificationBody
        )
          .then(() => {
            console.log(`Đã gửi thông báo đến thợ ${technician.name} (ID: ${technician._id}) ở ${technician.address.city}`);
          })
          .catch((notificationError) => {
            console.error(`Failed to send notification to technician ${technician._id}:`, notificationError);
          });
      } else {
        console.log(`Thợ ${technician.name} (ID: ${technician._id}) ở ${technician.address.city} không có FCM token.`);
        return Promise.resolve();
      }
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error notifying technicians:', error);
  }
}

module.exports = { notifyTechniciansInCity };