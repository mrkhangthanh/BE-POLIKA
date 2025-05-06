const Conversation = require('../models/Conversation');
const User = require('../../auth/models/user');

const getSupportConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ authMiddleware
    const user = await User.findById(userId);

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only admin or manager can access this endpoint',
      });
    }

    // Tìm hội thoại hỗ trợ hiện có (giả định admin/manager có hội thoại với một user mặc định hoặc nhóm hỗ trợ)
    let conversation = await Conversation.findOne({
      participants: { $elemMatch: { userId: userId } },
      isSupport: true, // Giả định Conversation có field isSupport để đánh dấu hội thoại hỗ trợ
    });

    // Nếu không có hội thoại, tạo mới
    if (!conversation) {
      // Tìm một user mặc định để tạo hội thoại (có thể là một tài khoản "Hỗ trợ" chung)
      const defaultSupportUser = await User.findOne({ role: 'support' }); // Giả định có role "support"
      if (!defaultSupportUser) {
        return res.status(404).json({
          success: false,
          message: 'Default support user not found',
        });
      }

      conversation = new Conversation({
        participants: [
          { userId: userId, role: user.role },
          { userId: defaultSupportUser._id, role: defaultSupportUser.role },
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