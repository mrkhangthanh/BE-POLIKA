const mongoose = require('../../../common/init.myDB')(); // Kết nối đến MongoDB

const ChatMessageSchema = new mongoose.Schema({
  orderId: String,
  messages: [
    {
      userId: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);