const mongoose = require('mongoose');
const Conversation = require('../../conversationsMessages/models/Conversation');
const User = require('../../auth/models/user');

const createSupportConversation = async (req, res) => {
  try {
    console.log('Req.user:', req.user);
    const sender = req.user;

    // Kiểm tra nếu không có sender (authMiddleware không hoạt động)
    if (!sender || !sender._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Kiểm tra vai trò của người gửi
    const allowedRoles = ['customer', 'technician'];
    if (!allowedRoles.includes(sender.role)) {
      return res.status(403).json({ message: 'Only customers and technicians can create support conversations' });
    }

    // Lấy danh sách tất cả admin và manager
    const adminsAndManagers = await User.find(
      { role: { $in: ['admin', 'manager'] } },
      '_id role'
    ).lean();

    if (!adminsAndManagers || adminsAndManagers.length === 0) {
      return res.status(404).json({ message: 'No admins or managers found' });
    }

    // Tạo danh sách participants: bao gồm sender và tất cả admin/manager
    const participants = [
      { userId: sender._id, role: sender.role },
      ...adminsAndManagers.map((user) => ({
        userId: user._id,
        role: user.role,
      })),
    ];

    // Kiểm tra xem đã có hội thoại hỗ trợ nào giữa sender và tất cả admin/manager chưa
    const existingConversation = await Conversation.findOne({
      isSupport: true,
      participants: {
        $all: participants.map((p) => ({
          $elemMatch: { userId: p.userId, role: p.role },
        })),
      },
    }).lean();

    if (existingConversation) {
      return res.status(200).json({ data: { conversationId: existingConversation._id.toString() } });
    }

    // Tạo hội thoại mới với isSupport: true
    const newConversation = new Conversation({
      participants,
      isSupport: true, // Đặt flag cho hội thoại hỗ trợ
    });

    await newConversation.save();
    console.log('New support conversation created:', newConversation._id.toString());
    res.status(201).json({ data: { conversationId: newConversation._id.toString() } });
  } catch (err) {
    console.error('Error in createSupportConversation:', err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { createSupportConversation };