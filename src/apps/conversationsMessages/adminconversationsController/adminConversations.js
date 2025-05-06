const Conversation = require('../models/Conversation');
const Message = require('../models/Message');


// GET /admin/conversations - Lấy danh sách hội thoại
const getAllConversations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const conversations = await Conversation.find()
      .populate('participants.userId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const totalRows = await Conversation.countDocuments();
    const totalPages = Math.ceil(totalRows / limit);

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({ conversationId: conversation._id })
          .sort({ created_at: -1 })
          .populate('sender.userId', 'name');
        return {
          ...conversation._doc,
          sender: conversation.participants[0],
          receiver: conversation.participants[1],
          lastMessage: lastMessage || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: conversationsWithLastMessage,
      pagination: {
        totalRows,
        totalPages,
        currentPage: parseInt(page),
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra: ' + error.message,
    });
  }
};
module.exports = {
  getAllConversations
};