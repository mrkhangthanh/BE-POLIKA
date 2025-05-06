const Conversation = require('../models/Conversation');
const Message = require('../models/Message');


// GET /admin/conversations/:conversationId - Lấy chi tiết hội thoại
const mongoose = require('mongoose');

const getConversationById = async (req, res) => {
    try {
      const { conversationId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ success: false, message: 'conversationId không hợp lệ' });
      }
  
      const conversation = await Conversation.findById(conversationId)
        .populate('participants.userId', 'name');
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hội thoại.',
        });
      }
  
      const messages = await Message.find({ conversationId })
        .populate('sender.userId', 'name')
        .sort({ created_at: 1 });
  
      res.status(200).json({
        success: true,
        conversation: {
          ...conversation._doc,
          sender: conversation.participants[0],
          receiver: conversation.participants[1],
          messages,
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
    getConversationById,
  };
  