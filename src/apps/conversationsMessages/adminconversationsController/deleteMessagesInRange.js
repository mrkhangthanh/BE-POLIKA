const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
 // Import model User

// Controller để xóa tin nhắn trong khoảng thời gian của một cuộc hội thoại
const deleteMessagesInRange = async (req, res) => {
  const { conversationId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Kiểm tra đầu vào
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ startDate và endDate.' });
    }

    // Kiểm tra hội thoại có tồn tại không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Hội thoại không tồn tại.' });
    }

    // Xóa các tin nhắn trong khoảng thời gian
    const result = await Message.deleteMany({
      conversationId: conversationId,
      created_at: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    res.status(200).json({
      success: true,
      message: `Đã xóa ${result.deletedCount} tin nhắn trong khoảng thời gian.`,
    });
  } catch (error) {
    console.error('Lỗi trong deleteMessagesInRange:', error);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// Controller để xóa nội dung tin nhắn của tất cả cuộc hội thoại giữa customer và technician trong khoảng thời gian
const deleteAllMessagesInRange = async (req, res) => {
  const { startDate, endDate } = req.query;

  // Kiểm tra đầu vào
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ startDate và endDate.' });
  }

  try {
    // Lấy tất cả cuộc hội thoại giữa customer và technician
    const conversations = await Conversation.find({
      $and: [
        { 'participants': { $elemMatch: { role: 'customer' } } },
        { 'participants': { $elemMatch: { role: 'technician' } } },
      ],
    });

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ success: false, message: 'Không có hội thoại nào giữa khách hàng và kỹ thuật viên.' });
    }

    // Lấy danh sách ID của các hội thoại
    const conversationIds = conversations.map(conversation => conversation._id);

    // Cập nhật nội dung tin nhắn trong khoảng thời gian
    const updateResult = await Message.updateMany(
      {
        conversationId: { $in: conversationIds },
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
      [
        {
          $set: {
            content: {
              $cond: {
                if: { $eq: ['$type', 'text'] },
                then: '[Đã xóa]',
                else: '$content',
              },
            },
            imageUrl: {
              $cond: {
                if: { $eq: ['$type', 'image'] },
                then: null,
                else: '$imageUrl',
              },
            },
          },
        },
      ]
    );

    res.status(200).json({
      success: true,
      message: `Đã xóa nội dung của ${updateResult.modifiedCount} tin nhắn trong khoảng thời gian.`,
    });
  } catch (error) {
    console.error('Lỗi trong deleteAllMessagesInRange:', error);
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};



module.exports = {
  deleteMessagesInRange,
  deleteAllMessagesInRange,
};