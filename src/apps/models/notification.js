const mongoose = require('../../common/init.myDB')();

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  type: {
    type: String,
    enum: ['service_request', 'order', 'message'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type', // Tham chiếu động đến ServiceRequest, Order, hoặc Message
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const NotificationModel = mongoose.model('Notifications', notificationSchema, 'notifications');
module.exports = NotificationModel;