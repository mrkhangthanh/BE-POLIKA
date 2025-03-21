const mongoose = require('../../common/init.myDB')();

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orders',
    default: null,
    // Note: Liên kết với đơn hàng (nếu có).
  },
  content: {
    type: String,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  indexes: [
    { key: { sender_id: 1 } },
    { key: { receiver_id: 1 } },
    { key: { order_id: 1 } },
  ],
});

const MessageModel = mongoose.model('Messages', messageSchema, 'messages');
module.exports = MessageModel;