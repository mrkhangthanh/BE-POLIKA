const mongoose = require('../../common/init.myDB')();

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
      },
      role: {
        type: String,
        enum: ['customer', 'admin', 'technician'],
        required: true,
      },
    },
  ],
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orders',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
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

const ConversationModel = mongoose.model('Conversations', conversationSchema, 'conversations');
module.exports = ConversationModel;