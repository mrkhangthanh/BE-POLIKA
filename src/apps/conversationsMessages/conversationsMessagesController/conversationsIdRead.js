const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log('Mark as read - User ID:', userId, 'Conversation ID:', conversationId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Tìm các tin nhắn chưa đọc trước khi cập nhật
    const unreadMessages = await Message.find({
      conversationId,
      'sender.userId': { $ne: userId },
      isRead: false,
    });

    // Cập nhật trạng thái isRead cho các tin nhắn chưa đọc
    const updatedResult = await Message.updateMany(
      { conversationId, 'sender.userId': { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );
    console.log('Updated Messages:', updatedResult);

    const io = req.app.get('io');
    if (!io) {
      console.error('Socket.IO instance is not available');
    } else {
      // Chỉ gửi sự kiện message_read cho các tin nhắn vừa được cập nhật
      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => {
          console.log('Emitting message_read event for message:', msg._id);
          io.to(conversationId.toString()).emit('message_read', {
            conversationId,
            messageId: msg._id,
          });
        });
      } else {
        console.log('No new messages to mark as read');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markAsRead };