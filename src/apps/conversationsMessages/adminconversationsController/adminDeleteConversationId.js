const Conversation = require('../models/Conversation');
const Message = require('../models/Message');


// DELETE /admin/conversations/:conversationId - Xóa hội thoại
const deleteConversation = async (req, res) => {
    try {
      const { conversationId } = req.params;
  
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hội thoại.',
        });
      }
  
      await Message.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);
  
      res.status(200).json({
        success: true,
        message: 'Hội thoại và các tin nhắn liên quan đã được xóa.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra: ' + error.message,
      });
    }
  };

module.exports = {
    deleteConversation,
};