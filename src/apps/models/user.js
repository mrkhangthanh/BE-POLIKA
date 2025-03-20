const mongoose = require('../../common/init.myDB')();
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  phone_number: {
    type: String,
    required: true,
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits'],
  },
  role: {
    type: String,
    enum: ['admin', 'customer', 'technician', 'agent'],
    required: true,
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'roleReferenceModel',
  },
  roleReferenceModel: {
    type: String,
    enum: ['Customer', 'Technician'],
    required: function () {
      return this.role === 'customer' || this.role === 'technician';
    },
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  last_login: {
    type: Date,
    default: null,
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  indexes: [
    { key: { email: 1 }, unique: true },
    { key: { phone_number: 1 }, unique: true },
    { key: { role: 1 } },
  ],
});

// Hook để mã hóa password trước khi lưu
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
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