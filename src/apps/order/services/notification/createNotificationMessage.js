function createNotificationMessage(serviceType, city) {
    return {
      title: 'Bạn có Đơn hàng mới!',
      body: `Một đơn hàng mới trong lĩnh vực ${serviceType.label} vừa được tạo tại ${city}. Kiểm tra ngay!`,
    };
  }
  
  module.exports = { createNotificationMessage };