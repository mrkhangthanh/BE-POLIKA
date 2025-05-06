const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../../auth/models/user');

// Lấy danh sách cuộc trò chuyện
const getConversations = async (req, res) => {
  try {
    // Kiểm tra req.user
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    const userId = req.user._id; // Sửa req.user.id thành req.user._id
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      'participants.userId': userId,
    })
      .populate('participants.userId', 'name role')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ created_at: -1 })
          .select('content created_at');

        const receiver = conv.participants.find(
          (p) => p.userId._id.toString() !== userId.toString()
        );

        const unreadMessages = await Message.countDocuments({
          conversationId: conv._id,
          isRead: false,
          'sender.userId': { $ne: userId },
        });

        return {
          id: conv._id,
          receiver: {
            id: receiver.userId._id,
            name: receiver.userId.name,
            role: receiver.userId.role,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                created_at: lastMessage.created_at,
              }
            : null,
          unread: unreadMessages > 0,
        };
      })
    );

    const total = await Conversation.countDocuments({
      'participants.userId': userId,
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getConversations };