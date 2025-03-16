const mongoose = require('../../common/init.myDB')();

const orderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customers',
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'cancelled'],
    default: 'pending',
  },
  items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      unit_price: {
        type: Number,
        required: true,
        min: 0,
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const OrderModel = mongoose.model('Orders', orderSchema, 'orders');
module.exports = OrderModel;