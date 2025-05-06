const mongoose = require('mongoose');
const Conversation = require('../../conversationsMessages/models/Conversation');
const User = require('../../auth/models/user');

const createSupportConversation = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Req.user:', req.user);
    const { receiverId } = req.body;
    const sender = req.user;

    // Kiểm tra receiverId hợp lệ
    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    // Kiểm tra nếu không có sender (authMiddleware không hoạt động)
    if (!sender || !sender._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Kiểm tra receiver có tồn tại và có role là admin/manager
    const receiver = await User.findById(receiverId).lean();
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    if (!['admin', 'manager'].includes(receiver.role)) {
      return res.status(400).json({ message: 'Receiver must be an admin or manager' });
    }

    // Kiểm tra xem đã có hội thoại giữa hai người này chưa
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: sender._id, role: sender.role } },
          { $elemMatch: { userId: receiverId, role: receiver.role } },
        ],
      },
    }).lean();

    if (existingConversation) {
      return res.status(200).json({ data: { conversationId: existingConversation._id.toString() } });
    }

    // Tạo hội thoại mới
    const newConversation = new Conversation({
      participants: [
        { userId: sender._id, role: sender.role },
        { userId: receiverId, role: receiver.role },
      ],
    });

    await newConversation.save();
    console.log('New conversation created:', newConversation._id.toString());
    res.status(201).json({ data: { conversationId: newConversation._id.toString() } });
  } catch (err) {
    console.error('Error in createSupportConversation:', err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { createSupportConversation };