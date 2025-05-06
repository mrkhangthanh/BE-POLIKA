const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Lấy chi tiết cuộc trò chuyện
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { limit = 1000, page = 1 } = req.query; // Tăng limit mặc định lên 1000
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    console.log('Fetching conversation detail - User ID:', userId, 'Conversation ID:', conversationId);

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.userId', 'name role')
      .lean();

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    console.log('Conversation after populate:', conversation);

    const isParticipant = conversation.participants.some((p) => {
      const participantId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
      return participantId === userId.toString();
    });
    console.log('Is Participant:', isParticipant);

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const receiver = conversation.participants.find((p) => {
      const participantId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
      return participantId !== userId.toString();
    });

    const messages = await Message.find({ conversationId })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalMessages = await Message.countDocuments({ conversationId });

    res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        receiver: {
          id: receiver.userId._id || receiver.userId,
          name: receiver.userId.name || 'Không xác định',
          role: receiver.userId.role || '',
        },
        messages: messages.map((msg) => ({
          id: msg._id,
          sender: {
            id: msg.sender.userId,
            role: msg.sender.role,
          },
          content: msg.content,
          type: msg.type,
          imageUrl: msg.imageUrl,
          reaction: msg.reaction,
          isRead: msg.isRead,
          created_at: msg.created_at,
        })),
        totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in getConversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getConversation };