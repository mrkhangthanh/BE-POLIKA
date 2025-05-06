const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Cập nhật reaction cho tin nhắn
const updateReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id; // Sửa req.user.id thành req.user._id
    const { reaction } = req.body;

    // Kiểm tra userId
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const validReactions = ['like', 'heart', 'haha', 'cry', 'angry', null];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const conversation = await Conversation.findById(message.conversationId);
    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    message.reaction = reaction;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('new_reaction', {
        messageId,
        reaction,
      });
    } else {
      console.error('Socket.IO instance is not available in updateReaction');
    }

    res.status(200).json({
      success: true,
      data: {
        id: messageId,
        reaction,
      },
    });
  } catch (error) {
    console.error('Error in updateReaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateReaction };