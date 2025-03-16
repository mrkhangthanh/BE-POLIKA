const mongoose = require('../../common/init.myDB')();

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Đảm bảo không có tên trùng lặp
  },
  description: {
    type: String,
    default: '', // Mô tả ngắn gọn về loại dịch vụ
  },
  active: {
    type: Boolean,
    default: true, // Cho phép kích hoạt/tắt loại dịch vụ
  },
}, { timestamps: true });

const ServiceCategoryModel = mongoose.model('ServiceCategories', serviceCategorySchema, 'serviceCategories');
module.exports = ServiceCategoryModel;