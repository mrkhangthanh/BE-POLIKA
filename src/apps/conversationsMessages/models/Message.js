const mongoose = require('../../../common/init.myDB')();

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users', // Thay 'User' thành 'Users'
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'technician', 'admin'],
      required: true,
    },
  },
  content: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text',
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  reaction: {
    type: String,
    enum: ['like', 'heart', 'haha', 'cry', 'angry', null],
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Validation: Nếu type là 'text', content phải có giá trị; nếu type là 'image', imageUrl phải có giá trị
messageSchema.pre('save', function (next) {
  if (this.type === 'text' && !this.content) {
    return next(new Error('Content is required for text messages'));
  }
  if (this.type === 'image' && !this.imageUrl) {
    return next(new Error('imageUrl is required for image messages'));
  }
  next();
});

// Index để tìm kiếm nhanh tin nhắn theo conversationId và created_at
messageSchema.index({ conversationId: 1, created_at: -1 });

module.exports = mongoose.model('Message', messageSchema);