const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../../auth/models/user');
const mongoose = require('mongoose');
const pagination = require('../../../libs/pagination'); // Điều chỉnh đường dẫn nếu cần

// Hàm thoát ký tự đặc biệt trong regex
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// Controller để tìm kiếm hội thoại (dành cho admin)
const searchAdminConversations = async (req, res) => {
  let { keyword, page = 1, limit = 10 } = req.query;

  try {
    // Kiểm tra và xử lý query parameters
    if (typeof keyword !== 'string') {
      return res.status(400).json({ success: false, message: 'Từ khóa tìm kiếm phải là chuỗi.' });
    }

    keyword = keyword.trim();
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp từ khóa tìm kiếm hợp lệ.' });
    }

    // Tạo regex pattern để tìm kiếm tương đối
    const escapedKeyword = escapeRegex(keyword);
    const regexPattern = `.*${escapedKeyword}.*`;

    // Tìm kiếm tin nhắn có nội dung khớp với keyword, loại bỏ tin nhắn đã xóa
    const messages = await Message.find({
      content: { $regex: regexPattern, $options: 'i' },
      type: 'text',
      content: { $ne: '[Đã xóa]' },
      conversationId: { $type: 'objectId' },
    }).select('conversationId');

    // Lọc các conversationId hợp lệ
    const conversationIds = messages
      .filter(message => mongoose.Types.ObjectId.isValid(message.conversationId))
      .map(message => message.conversationId.toString());
    const uniqueConversationIds = [...new Set(conversationIds)];

    // Tìm kiếm user có tên khớp với keyword
    const users = await User.find({
      name: { $regex: regexPattern, $options: 'i' },
    }).select('_id');
    const userIds = users.map(user => user._id);

    // Tạo query tìm kiếm hội thoại
    const query = {
      $or: [
        { _id: { $in: uniqueConversationIds.map(id => new mongoose.Types.ObjectId(id)) } },
        { 'participants.userId': { $in: userIds } },
      ],
    };

    // Sử dụng hàm pagination chung để tính toán phân trang
    const paginationInfo = await pagination(page, limit, Conversation, query);

    // Tìm kiếm hội thoại với skip và limit
    let conversations = await Conversation.find(query)
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    // Populate participants.userId an toàn
    conversations = await Conversation.populate(conversations, {
      path: 'participants.userId',
      select: 'name',
      match: { name: { $exists: true } },
    });

    // Gán sender, receiver và lastMessage cho từng hội thoại
    for (let conversation of conversations) {
      if (!Array.isArray(conversation.participants) || conversation.participants.length !== 2) {
        conversation.participants = [{ userId: null, role: 'N/A' }, { userId: null, role: 'N/A' }];
      }

      conversation.sender = conversation.participants.find(p => p.role === 'customer') || conversation.participants[0];
      conversation.receiver = conversation.participants.find(p => p.role === 'technician') || conversation.participants[1];

      if (!conversation.sender.userId) conversation.sender.userId = { name: 'N/A' };
      if (!conversation.receiver.userId) conversation.receiver.userId = { name: 'N/A' };

      const lastMessage = await Message.findOne({ conversationId: conversation._id })
        .sort({ created_at: -1 })
        .lean();
      conversation.lastMessage = lastMessage || null;
    }

    // Trả về kết quả với thông tin phân trang
    res.status(200).json({
      success: true,
      conversations,
      pagination: {
        totalRows: paginationInfo.totalRows,
        totalPages: paginationInfo.totalPages,
        currentPage: paginationInfo.currentPage,
        hasNext: paginationInfo.hasNext,
        hasPrev: paginationInfo.hasPrev,
      },
    });
  } catch (error) {
    console.error('[searchAdminConversations] Lỗi:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

module.exports = {
  searchAdminConversations,
};