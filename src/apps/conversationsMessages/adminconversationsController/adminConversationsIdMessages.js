const Conversation = require('../models/Conversation');
const Message = require('../models/Message');


// POST /admin/conversations/:conversationId/messages - Gửi tin nhắn mới
const sendMessage = async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, type = 'text', imageUrl } = req.body;
  
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hội thoại.',
        });
      }
  
      const senderRole = req.user.role === 'technician' ? 'technician' : 'customer';
      const isParticipant = conversation.participants.some(
        (participant) => participant.userId.toString() === req.user._id.toString()
      );
      if (!isParticipant && !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền gửi tin nhắn trong hội thoại này.',
        });
      }
  
      const newMessage = new Message({
        conversationId,
        sender: {
          userId: req.user._id,
          role: senderRole,
        },
        content: type === 'text' ? content : undefined,
        type,
        imageUrl: type === 'image' ? imageUrl : undefined,
        isRead: false,
      });
  
      await newMessage.save();
  
      res.status(201).json({
        success: true,
        message: 'Tin nhắn đã được gửi.',
        newMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Đã có lỗi xảy ra: ' + error.message,
      });
    }
  };

  module.exports = {
    sendMessage,
  };