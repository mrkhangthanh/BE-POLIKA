const Conversation = require('../models/Conversation');
const User = require('../../auth/models/user');

const getSupportConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ authMiddleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Tìm hội thoại hỗ trợ hiện có
    let conversation = await Conversation.findOne({
      participants: { $elemMatch: { userId: userId } },
      isSupport: true,
    });

    // Nếu không có hội thoại, tạo mới
    if (!conversation) {
      // Tìm một admin hoặc manager mặc định để tạo hội thoại
      const supportUser = await User.findOne({
        role: { $in: ['admin', 'manager'] },
      });
      if (!supportUser) {
        return res.status(404).json({
          success: false,
          message: 'No admin or manager found to create support conversation',
        });
      }

      conversation = new Conversation({
        participants: [
          { userId: userId, role: user.role },
          { userId: supportUser._id, role: supportUser.role },
        ],
        isSupport: true,
        created_at: new Date(),
      });

      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      data: { conversationId: conversation._id.toString() },
    });
  } catch (error) {
    console.error('Error in getSupportConversation:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};

module.exports = {
  getSupportConversation,
};