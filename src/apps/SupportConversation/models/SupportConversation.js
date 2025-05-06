const mongoose = require('mongoose');

const supportConversationSchema = new mongoose.Schema({
  participants: {
    type: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
      role: { type: String, required: true },
    }],
    required: true,
  },
  isSupport: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const SupportConversation = mongoose.model('SupportConversation', supportConversationSchema);

module.exports = SupportConversation;