const mongoose = require('../../common/init.myDB')(); // [Cập nhật] Sử dụng init.myDB để khởi tạo kết nối MongoDB
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // [Cập nhật] Thêm trim để loại bỏ khoảng trắng thừa
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // [Cập nhật] Thêm trim
    lowercase: true, // [Cập nhật] Chuyển email về lowercase
    match: [ // [Cập nhật] Thêm validation định dạng email
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long'] // [Cập nhật] Thêm minlength
  },
  phone_number: {
    type: String,
    required: true,
    trim: true, // [Cập nhật] Thêm trim
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits'] // [Cập nhật] Thêm validation
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'content_writer', 'technician', 'customer', 'agent'], // [Cập nhật] Thêm 'agent' (theo yêu cầu trước đó)
    required: true // [Cập nhật] Thêm required
  },
  address: { // [Cập nhật] Định nghĩa trực tiếp trong userSchema, thêm logic required động
    street: {
      type: String,
      required: function () {
        return this.role === 'customer' || this.role === 'technician';
      }
    },
    city: {
      type: String,
      required: function () {
        return this.role === 'customer' || this.role === 'technician';
      }
    },
    district: {
      type: String,
      required: function () {
        return this.role === 'customer' || this.role === 'technician';
      }
    },
    ward: {
      type: String,
      required: function () {
        return this.role === 'customer' || this.role === 'technician';
      }
    },
    country: {
      type: String,
      default: 'Vietnam'
    }
  },
  specialization: {
    type: [String],
    required: function () { // [Cập nhật] Thêm required động cho technician
      return this.role === 'technician';
    },
    default: [], // [Cập nhật] Thêm default
    enum: { // [Cập nhật] Thêm enum để giới hạn giá trị
      values: ['plumbing', 'electrical', 'carpentry', 'hvac'],
      message: 'Specialization must be one of: plumbing, electrical, carpentry, hvac'
    }
  },
  avatar: {
    type: String,
    default: null // [Cập nhật] Thêm default
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users', // [Cập nhật] Thay đổi ref thành 'Users'
    default: null // [Cập nhật] Thêm default
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  last_login: {
    type: Date,
    default: null // [Cập nhật] Thêm default
  },
  reset_password_token: {
     type: String,
      default: null 
    },
  reset_password_expires: { 
    type: Date, 
    default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, // [Cập nhật] Sử dụng timestamps của Mongoose
  indexes: [ // [Cập nhật] Thêm indexes để tối ưu truy vấn
    { key: { email: 1 }, unique: true },
    { key: { phone_number: 1 }, unique: true },
    { key: { role: 1 } }
  ]
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  // [Cập nhật] Xóa logic cập nhật updated_at thủ công vì đã dùng timestamps
  next();
});

const UserModel = mongoose.model('Users', userSchema, 'users'); // [Cập nhật] Đổi tên model thành 'Users' và chỉ định collection 'users'
module.exports = UserModel;