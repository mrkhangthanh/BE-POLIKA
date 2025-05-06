const mongoose = require('../../../common/init.myDB')();

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orders',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['new_order', 'order_update', 'system', 'order_accepted'],
    default: 'new_order',
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);