const mongoose = require('../../common/init.myDB')();
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // Note: Tên đầy đủ của người dùng (ví dụ: "Nguyễn Văn A"). Bắt buộc để hiển thị và liên lạc. Áp dụng cho tất cả vai trò (admin, customer, technician, agent).
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    // Note: Địa chỉ email của người dùng, dùng để đăng nhập và gửi thông báo. Phải duy nhất, chuyển thành chữ thường, và khớp định dạng email hợp lệ.
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long'],
    // Note: Mật khẩu của người dùng (được mã hóa bằng bcrypt trước khi lưu). Bắt buộc, tối thiểu 8 ký tự để đảm bảo bảo mật.
  },
  phone_number: {
    type: String,
    required: true, // Đảm bảo bắt buộc cho tất cả vai trò
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits'],
    // Note: Số điện thoại của người dùng (ví dụ: "0901234567"). Bắt buộc cho tất cả vai trò (admin, customer, technician, agent). Chỉ chấp nhận 10-11 số, phù hợp với định dạng số điện thoại Việt Nam.
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'technician', 'agent'],
    required: true,
    // Note: Vai trò của người dùng, chỉ chấp nhận các giá trị: 'admin' (quản trị viên), 'customer' (khách hàng), 'technician' (thợ), 'agent' (đại lý). Bắt buộc để phân quyền.
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'roleReferenceModel',
    required: function () {
      return this.role === 'customer' || this.role === 'technician';
    },
    // Note: ID tham chiếu đến model tương ứng với vai trò. Ví dụ: nếu role là 'customer', tham chiếu đến model 'Customer'; nếu role là 'technician', tham chiếu đến model 'Technician'. Bắt buộc với customer và technician, không áp dụng cho admin và agent.
  },
  roleReferenceModel: {
    type: String,
    enum: ['Customer', 'Technician'],
    required: function () {
      return this.role === 'customer' || this.role === 'technician';
    },
    // Note: Xác định model mà reference_id tham chiếu đến. Ví dụ: 'Customer' cho role 'customer', 'Technician' cho role 'technician'. Bắt buộc với customer và technician.
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: null,
    // Note: ID của người dùng (thường là agent) đã giới thiệu khách hàng này. Chỉ áp dụng cho role 'customer'. Tùy chọn, mặc định là null nếu không có người giới thiệu.
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    // Note: Trạng thái tài khoản (active hoặc inactive). Mặc định là 'active', dùng để quản lý tài khoản (ví dụ: khóa tài khoản nếu cần).
  },
  last_login: {
    type: Date,
    default: null,
    // Note: Thời gian đăng nhập cuối cùng của người dùng. Tùy chọn, mặc định null, dùng để theo dõi hoạt động.
  },
}, {
  timestamps: {
    createdAt: 'created_at', // Note: Thời gian tạo tài khoản, tự động gán khi tạo document.
    updatedAt: 'updated_at', // Note: Thời gian cập nhật lần cuối, tự động cập nhật khi document thay đổi.
  },
  indexes: [
    { key: { email: 1 }, unique: true }, // Index duy nhất cho email
    { key: { phone_number: 1 }, unique: true }, // Index duy nhất cho phone_number (tránh trùng lặp số điện thoại)
    { key: { role: 1 } }, // Index cho role để tăng hiệu suất tìm kiếm theo vai trò
  ],
});

// Hook để mã hóa password trước khi lưu
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    // Note: Mã hóa mật khẩu bằng bcrypt với salt rounds = 10 trước khi lưu vào database.
  }
  next();
});

// Hook để tự động cập nhật updated_at (nếu cần logic bổ sung)
userSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updated_at = new Date();
  }
  next();
});

const UserModel = mongoose.model('Users', userSchema, 'users');
module.exports = UserModel;