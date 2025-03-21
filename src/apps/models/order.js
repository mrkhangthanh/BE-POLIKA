const mongoose = require('../../common/init.myDB')();

const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  technician_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    default: null
  },
  service_type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    ward: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Vietnam'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { customer_id: 1 } },
    { key: { technician_id: 1 } },
    { key: { service_type: 1 } }
  ]
});

const OrderModel = mongoose.model('Orders', orderSchema, 'orders');
module.exports = OrderModel;