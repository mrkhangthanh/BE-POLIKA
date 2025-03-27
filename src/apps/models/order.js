const mongoose = require('../../common/init.myDB')();

const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  technician_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: null,
  },
  service_type: {
    type: String,
    enum: {
      values: ['plumbing', 'electrical', 'carpentry', 'hvac'],
      message: 'Service type must be one of: plumbing, electrical, carpentry, hvac',
    },
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  total_amount: { type: Number, required: true, min: 0 }, // Thêm trường total_amount
  address: { // Thêm trường address
    street: { type: String, required: false },
    city: { type: String, required: false },
    district: { type: String, required: false },
    ward: { type: String, required: false },
    country: { type: String, default: 'Vietnam' },
  },
  phone_number: { type: String, required: false }, // Thêm trường phone_number
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  price: {
    type: Number,
    default: 0, // Giá dịch vụ, technician có thể cập nhật sau khi nhận đơn
    min: [0, 'Price cannot be negative'],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { customer_id: 1 } },
    { key: { technician_id: 1 } },
    { key: { service_type: 1 } },
  ],
});

const OrderModel = mongoose.model('Orders', orderSchema, 'orders');
module.exports = OrderModel;