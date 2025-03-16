const mongoose = require('../../common/init.myDB')();

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // Note: Tên đầy đủ của khách hàng (ví dụ: "Nguyễn Văn A"). Bắt buộc, loại bỏ khoảng trắng thừa.
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    // Note: Địa chỉ email của khách hàng, phải duy nhất, chuyển thành chữ thường, và khớp định dạng email hợp lệ.
  },
  password: {
    type: String,
    required: true,
    // Note: Mật khẩu của khách hàng (nên mã hóa bằng bcrypt trước khi lưu). Bắt buộc để đăng nhập.
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{10,11}$/,
    // Note: Số điện thoại của khách hàng (ví dụ: "0901234567"). Bắt buộc, chỉ chấp nhận 10-11 số.
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
  role: {
    type: String,
    enum: ['customer'],
    default: 'customer',
    // Note: Vai trò của người dùng, chỉ chấp nhận 'customer' để đảm bảo tính nhất quán.
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    // Note: Trạng thái tài khoản (active hoặc inactive). Mặc định là 'active'.
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Giả định User là model đại diện cho agent
    default: null,
    // Note: ID của agent hoặc người giới thiệu khách hàng (nếu có). Tùy chọn, mặc định null.
  },
}, {
  timestamps: {
    createdAt: 'created_at', // Note: Thời gian tạo tài khoản khách hàng, tự động gán khi tạo.
    updatedAt: 'updated_at', // Note: Thời gian cập nhật lần cuối, tự động cập nhật khi thay đổi.
  },
  // Thêm index để tăng hiệu suất
  indexes: [
    { key: { email: 1 }, unique: true }, // Index duy nhất cho email
    { key: { phone: 1 }, unique: false }, // Index cho phone (nếu muốn tránh trùng lặp)
  ],
});

const CustomerModel = mongoose.model('Customers', customerSchema, 'customers');
module.exports = CustomerModel;