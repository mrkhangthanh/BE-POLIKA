const mongoose = require('../../../common/init.myDB')();
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: false, trim: true },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters long'] },
  phone_number: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'content_writer', 'customer', 'technician', 'agent'],
    required: [true, 'Vai trò là bắt buộc']
  },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType', index: true }], // Lưu danh sách ID dịch vụ
  fcmToken: { type: String }, // Thêm trường để lưu FCM token
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    district: { type: String, required: false },
    ward: { type: String, required: false },
    country: { type: String, default: 'Vietnam' }
  },
  // specialization: {
  //   type: [String],
  //   required: false, // Bỏ yêu cầu bắt buộc
  //   default: [],
  //   enum: ['plumbing', 'electrical', 'carpentry', 'hvac']
  // },
  avatar: { type: String, default: null },
  referred_by: { 
    type: String,
    default: null
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  commission: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  last_login: { type: Date, default: null },
  reset_password_token: { type: String, default: null },
  reset_password_expires: { type: Date, default: null },
  refresh_token: { type: String, default: null },
  refresh_token_expires: { type: Date, default: null },
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  status_history: [
    {
      status: { type: String, enum: ['active', 'inactive'], required: true },
      changedAt: { type: Date, default: Date.now },
      reason: { type: String, required: true }
    }
  ]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { email: 1 }, unique: true },
    { key: { phone_number: 1 }, unique: true },
    { key: { role: 1 } },
    { key: { refresh_token: 1 } }
  ]
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified('status')) {
    const previousStatus = this._previousStatus || this.status;
    if (previousStatus !== this.status) {
      this.status_history.push({
        status: this.status,
        changedAt: new Date(),
        reason: this._updateReason || 'System action'
      });
    }
    this._previousStatus = this.status;
  }

  if (this.role !== 'agent' && this.commission > 0) {
    return next(new Error('Chỉ đại lý (agent) mới có thể có tỷ lệ hoa hồng.'));
  }

  next();
});

userSchema.pre('save', function (next) {
  if (this.isNew) {
    this._previousStatus = null;
    this.status_history.push({
      status: this.status,
      changedAt: new Date(),
      reason: 'User created'
    });
  }
  next();
});

const UserModel = mongoose.model('Users', userSchema, 'users');
module.exports = UserModel;