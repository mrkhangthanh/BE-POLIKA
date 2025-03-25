const mongoose = require('../../common/init.myDB')();
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // [SỬA] Không bắt buộc
    trim: true
  },
  email: {
    type: String,
    required: false, // [SỬA] Không bắt buộc
    unique: true,
    sparse: true, // [THÊM] Hỗ trợ nhiều giá trị null
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  phone_number: {
    type: String,
    required: false, // [SỬA] Không bắt buộc
    unique: true,
    sparse: true, // [THÊM] Hỗ trợ nhiều giá trị null
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'content_writer', 'technician', 'customer', 'agent'],
    default: 'customer'
  },
  address: {
    street: {
      type: String,
      required: false // [SỬA] Không bắt buộc
    },
    city: {
      type: String,
      required: false // [SỬA] Không bắt buộc
    },
    district: {
      type: String,
      required: false // [SỬA] Không bắt buộc
    },
    ward: {
      type: String,
      required: false // [SỬA] Không bắt buộc
    },
    country: {
      type: String,
      default: 'Vietnam'
    }
  },
  specialization: {
    type: [String],
    required: function () {
      return this.role === 'technician';
    },
    default: [],
    enum: {
      values: ['plumbing', 'electrical', 'carpentry', 'hvac'],
      message: 'Specialization must be one of: plumbing, electrical, carpentry, hvac'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  last_login: {
    type: Date,
    default: null
  },
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expires: {
    type: Date,
    default: null
  },
  refresh_token: {
    type: String,
    default: null
  },
  refresh_token_expires: {
    type: Date,
    default: null
  },
  status_history: [ // [THÊM] Thêm status_history từ các bước trước
    {
      status: { type: String, enum: ['active', 'inactive'], required: true },
      changedAt: { type: Date, default: Date.now },
      reason: { type: String, required: true },
    },
  ],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { email: 1 }, unique: true },
    { key: { phone_number: 1 }, unique: true },
    { key: { role: 1 } }
  ]
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // [THÊM] Lưu lịch sử trạng thái nếu status thay đổi
  if (this.isModified('status')) {
    const previousStatus = this._previousStatus || this.status;
    const newStatus = this.status;

    if (previousStatus !== newStatus) {
      this.status_history.push({
        status: newStatus,
        changedAt: new Date(),
        reason: this._updateReason || 'System action',
      });
    }

    this._previousStatus = newStatus;
  }

  next();
});

userSchema.pre('save', function (next) {
  if (this.isNew) {
    this._previousStatus = null;
    this.status_history.push({
      status: this.status,
      changedAt: new Date(),
      reason: 'User created',
    });
  }
  next();
});

const UserModel = mongoose.model('Users', userSchema, 'users');
module.exports = UserModel;