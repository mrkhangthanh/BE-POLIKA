// const mongoose = require('../../../common/init.myDB')();

// const serviceTypeSchema = new mongoose.Schema({
//   value: { type: String, required: true, unique: true }, // Khóa định danh (ví dụ: 'DienNuoc')
//   label: { type: String, required: true },               // Tên hiển thị (ví dụ: 'Điện nước')
//   description: { type: String },                         // Mô tả chi tiết về loại dịch vụ
//   isActive: { type: Boolean, default: true },            // Trạng thái hoạt động (mặc định là true)
// }, {
//   timestamps: true,                                       // Tự động thêm trường createdAt và updatedAt
// });

// module.exports = mongoose.model('ServiceType', serviceTypeSchema);