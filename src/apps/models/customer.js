const mongoose = require('../../common/init.myDB')();

const customerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    unique: true,
    // Note: Liên kết với document trong collection 'users' có role là 'customer'. Đảm bảo mỗi Customer chỉ liên kết với một User.
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
      // Note: Tên đường (ví dụ: "123 Lê Lợi"). Bắt buộc, loại bỏ khoảng trắng thừa.
    },
    city: {
      type: String,
      required: true,
      trim: true,
      // Note: Thành phố (ví dụ: "Hồ Chí Minh"). Bắt buộc, loại bỏ khoảng trắng thừa.
    },
    district: {
      type: String,
      required: true,
      trim: true,
      // Note: Quận/huyện (ví dụ: "Quận 1"). Bắt buộc, loại bỏ khoảng trắng thừa.
    },
    ward: {
      type: String,
      required: true,
      trim: true,
      // Note: Phường/xã (ví dụ: "Phường Bến Nghé"). Bắt buộc, loại bỏ khoảng trắng thừa.
    },
    country: {
      type: String,
      trim: true,
      default: 'Vietnam',
      // Note: Quốc gia (mặc định là "Vietnam"). Tùy chọn, phù hợp với bối cảnh Việt Nam.
    },
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users', // Thống nhất với UserModel
    default: null,
    // Note: ID của agent hoặc người giới thiệu khách hàng (nếu có). Tùy chọn, mặc định null.
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

// Đăng ký model với tên 'Customer' để khớp với roleReferenceModel
const CustomerModel = mongoose.model('Customer', customerSchema, 'customers');
module.exports = CustomerModel;