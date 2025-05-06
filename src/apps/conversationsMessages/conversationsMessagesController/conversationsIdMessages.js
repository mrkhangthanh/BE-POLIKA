const Conversation = require('../models/Conversation');
const SupportConversation = require('../../SupportConversation/models/SupportConversation');
const Message = require('../models/Message');
const User = require('../../auth/models/user');

// Gửi tin nhắn mới
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Invalid sender data' });
    }

    const userId = req.user._id.toString();
    const userRole = req.user.role || 'unknown';
    const { content, type } = req.body;
    let imageUrl = null;

    if (type === 'image' && req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Tìm conversation và populate participants
    let conversation;
    const isSupportConversation = await SupportConversation.exists({ _id: conversationId });
    if (isSupportConversation) {
      conversation = await SupportConversation.findById(conversationId).populate('participants.userId');
    } else {
      conversation = await Conversation.findById(conversationId).populate('participants.userId');
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Kiểm tra user có phải participant không
    const isParticipant = conversation.participants.some(
      (p) => p.userId && p.userId._id && p.userId._id.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Xác định receiverId cho Conversation (1:1), bỏ qua cho SupportConversation
    let receiverId = null;
    if (!isSupportConversation && conversation.participants.length === 2) {
      const receiverParticipant = conversation.participants.find(
        (p) => p.userId && p.userId._id && p.userId._id.toString() !== userId
      );
      if (receiverParticipant && receiverParticipant.userId && receiverParticipant.userId._id) {
        receiverId = receiverParticipant.userId._id.toString();
      } else {
        return res.status(400).json({ success: false, message: 'Receiver not found in conversation' });
      }
    }

    // Lưu tin nhắn vào database
    const message = new Message({
      conversationId,
      sender: {
        userId,
        role: userRole,
      },
      content: type === 'text' ? content : undefined,
      type,
      imageUrl,
      isRead: false,
    });

    await message.save();

    // Chuẩn bị dữ liệu newMessage để phát qua socket
    const newMessage = {
      id: message._id.toString(),
      conversationId,
      sender: {
        id: userId,
        role: userRole,
        name: req.user.name || 'Người gửi',
      },
      content: message.content,
      type: message.type,
      imageUrl: message.imageUrl,
      created_at: message.created_at,
      reaction: message.reaction,
      isRead: message.isRead,
    };

    // Phát sự kiện new_message qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('new_message', newMessage);
      console.log(`New message sent to conversation room ${conversationId}:`, newMessage);

      // Gửi tin nhắn đến receiver hoặc tất cả participants (trừ sender) tùy loại hội thoại
      if (receiverId && receiverId !== userId) {
        io.to(receiverId).emit('new_message', newMessage);
        console.log(`New message sent to user ${receiverId}:`, newMessage);
      } else if (isSupportConversation) {
        const participants = conversation.participants;
        for (const participant of participants) {
          const participantId = participant.userId._id ? participant.userId._id.toString() : participant.userId.toString();
          if (participantId !== userId) {
            io.to(participantId).emit('new_message', newMessage);
            console.log(`New message sent to user ${participantId}:`, newMessage);
          }
        }
      }
    } else {
      console.error('Socket.IO instance is not available in sendMessage');
    }

    // Trả về phản hồi
    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage };