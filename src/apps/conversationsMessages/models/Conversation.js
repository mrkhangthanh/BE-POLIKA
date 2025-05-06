const mongoose = require('../../../common/init.myDB')();

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Thay 'User' thành 'Users'
        required: true,
      },
      role: {
        type: String,
        enum: ['customer', 'technician', 'admin', 'manager'],
        required: true,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Đảm bảo mỗi cuộc trò chuyện chỉ có 2 người tham gia
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('A conversation must have exactly 2 participants'));
  }
  next();
});

// Index để tìm kiếm nhanh các cuộc trò chuyện theo participants
conversationSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);