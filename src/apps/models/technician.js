const mongoose = require('../../common/init.myDB')();

const technicianSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    unique: true,
    // Note: Liên kết với document trong collection 'users' có role là 'technician'. Đảm bảo mỗi Technician chỉ liên kết với một User.
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
  },
  specialization: {
    type: [String],
    required: true,
    // Note: Danh sách chuyên môn của kỹ thuật viên (ví dụ: ['điện', 'nước']).
  },
  availability: {
    type: String,
    enum: ['available', 'busy'],
    default: 'available',
    // Note: Trạng thái sẵn sàng của kỹ thuật viên.
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  indexes: [
    { key: { user_id: 1 }, unique: true }, // Index duy nhất cho user_id
  ],
});

// Đăng ký model với tên 'Technician' để khớp với roleReferenceModel
const TechnicianModel = mongoose.model('Technician', technicianSchema, 'technicians');
module.exports = TechnicianModel;