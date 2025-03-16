const mongoose = require('../../common/init.myDB')();

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversations',
    required: true,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
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

const MessageModel = mongoose.model('Messages', messageSchema, 'messages');
module.exports = MessageModel;