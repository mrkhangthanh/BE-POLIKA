const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../../auth/models/user');

// Gửi tin nhắn mới
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    const { content, type } = req.body;
    let imageUrl = null;

    if (type === 'image' && req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Tìm conversation và populate participants
    const conversation = await Conversation.findById(conversationId).populate('participants.userId');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Kiểm tra user có phải participant không
    const isParticipant = conversation.participants.some(
      (p) => p.userId._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Xác định receiverId từ participants
    let receiverId;
    const senderParticipant = conversation.participants.find(
      (p) => p.userId._id.toString() === userId.toString()
    );
    const receiverParticipant = conversation.participants.find(
      (p) => p.userId._id.toString() !== userId.toString()
    );

    if (!receiverParticipant) {
      return res.status(400).json({ success: false, message: 'Receiver not found in conversation' });
    }

    receiverId = receiverParticipant.userId._id.toString();
    const receiverName = receiverParticipant.userId.name; // Lấy tên của người nhận (nếu cần)

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
      id: message._id,
      conversationId,
      sender: {
        id: userId,
        role: userRole,
        name: req.user.name, // Thêm name vào sender
      },
      content: message.content,
      type: message.type,
      imageUrl: message.imageUrl,
      created_at: message.created_at,
      reaction: message.reaction,
      isRead: message.isRead,
      receiverId, // Thêm receiverId vào newMessage
    };

    // Phát sự kiện new_message qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Phát đến phòng conversationId (giữ nguyên logic cũ)
      io.to(conversationId.toString()).emit('new_message', newMessage);
      console.log(`New message sent to conversation room ${conversationId}:`, newMessage);

      // Phát đến phòng của người nhận (receiverId)
      if (receiverId && receiverId !== userId.toString()) {
        io.to(receiverId).emit('new_message', newMessage);
        console.log(`New message sent to user ${receiverId}:`, newMessage);
      } else {
        console.log(`No receiverId available or receiver is the sender:`, newMessage);
      }
    } else {
      console.error('Socket.IO instance is not available in sendMessage');
    }

    // Trả về phản hồi
    res.status(201).json({
      success: true,
      data: newMessage, // Trả về full newMessage thay vì chỉ data
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage };