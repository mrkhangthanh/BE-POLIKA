const Order = require('../apps/order/models/order');
const Conversation = require('../apps/conversationsMessages/models/Conversation');
const Message = require('../apps/conversationsMessages/models/Message');

const handleSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Xử lý khi user tham gia (join) dựa trên userId
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Xử lý tham gia phòng conversation (dành cho tin nhắn)
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    // Xử lý rời phòng conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.id} left conversation: ${conversationId}`);
    });

    // Xử lý live update đơn hàng
    socket.on('new_order', async (newOrder) => {
      try {
        const order = new Order(newOrder);
        await order.save();
        const updatedOrders = await Order.find().sort({ created_at: -1 });
        io.emit('order_update', updatedOrders);
      } catch (err) {
        console.error('Error in new_order:', err.message);
      }
    });

    // Xử lý tham gia phòng chat của đơn hàng
    socket.on('join_chat', async ({ orderId, userId }) => {
      const room = `chat_${orderId}`;
      socket.join(room);
      console.log(`${userId} joined chat room for order ${orderId}`);

      try {
        let chat = await ChatMessage.findOne({ orderId });
        if (!chat) {
          chat = new ChatMessage({ orderId, messages: [] });
          await chat.save();
        }
        socket.emit('chat_history', chat.messages || []);
      } catch (err) {
        console.error('Error in join_chat:', err.message);
      }
    });

    // Xử lý gửi tin nhắn mới (dành cho chat đơn hàng - giữ nguyên)
    socket.on('send_message', async (message) => {
      try {
        console.log('Received send_message:', message);

        const { orderId, sender, content } = message;

        if (!sender || !sender.id) {
          throw new Error('Invalid sender data');
        }

        const order = await Order.findById(orderId);
        if (!order) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        console.log('Order data:', order);

        let receiverId;
        if (sender.id === order.customer_id.toString()) {
          receiverId = order.technician_id ? order.technician_id.toString() : null;
        } else if (order.technician_id && sender.id === order.technician_id.toString()) {
          receiverId = order.customer_id.toString();
        } else {
          throw new Error(`Sender ${sender.id} does not belong to order ${orderId}`);
        }
        console.log('Sender ID:', sender.id);
        console.log('Receiver ID:', receiverId);

        let chat = await ChatMessage.findOne({ orderId });
        if (!chat) {
          chat = new ChatMessage({ orderId, messages: [] });
        }

        const newMessage = {
          sender: { id: sender.id, name: sender.name },
          content,
          timestamp: new Date(),
        };

        chat.messages.push(newMessage);
        await chat.save();

        newMessage.receiverId = receiverId;

        const room = `chat_${orderId}`;
        io.to(room).emit('new_message', newMessage);

        if (receiverId && receiverId !== sender.id) {
          io.to(receiverId).emit('new_message', newMessage);
          console.log(`New message sent to room ${room} and user ${receiverId}:`, newMessage);
        } else {
          console.log(`New message sent to room ${room} (no receiverId available):`, newMessage);
        }
      } catch (err) {
        console.error('Error in send_message:', err.message);
      }
    });

    // Xử lý gửi tin nhắn mới dựa trên conversationId (sự kiện hiện tại)
    socket.on('send_conversation_message', async (message) => {
      try {
        console.log('Received send_conversation_message:', message);

        const { conversationId, sender, content, type, created_at } = message;

        if (!sender || !sender.id || !sender.role || !sender.name) {
          throw new Error('Invalid sender data');
        }

        if (!conversationId) {
          throw new Error('Conversation ID is required');
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          throw new Error(`Conversation with ID ${conversationId} not found`);
        }
        console.log('Conversation data:', conversation);

        let receiverId;
        const participants = conversation.participants;
        for (const participant of participants) {
          if (participant.userId.toString() !== sender.id) {
            receiverId = participant.userId.toString();
            break;
          }
        }

        if (!receiverId) {
          throw new Error('No receiver found for this conversation');
        }
        console.log('Sender ID:', sender.id);
        console.log('Receiver ID:', receiverId);

        const newMessage = new Message({
          conversationId,
          sender: {
            userId: sender.id,
            role: sender.role,
          },
          content: type === 'text' ? content : undefined,
          type,
          imageUrl: type === 'image' ? content : undefined,
          isRead: false,
          created_at: created_at || new Date(),
        });

        await newMessage.save();

        const socketMessage = {
          id: newMessage._id,
          conversationId,
          sender: {
            id: sender.id,
            role: sender.role,
            name: sender.name,
          },
          content,
          type,
          created_at: created_at || new Date().toISOString(),
          isRead: false,
        };

        io.to(conversationId).emit('new_message', socketMessage);

        if (receiverId && receiverId !== sender.id) {
          io.to(receiverId).emit('new_message', socketMessage);
          console.log(`New message sent to conversation ${conversationId} and user ${receiverId}:`, socketMessage);
        } else {
          console.log(`New message sent to conversation ${conversationId} (no receiverId available):`, socketMessage);
        }
      } catch (err) {
        console.error('Error in send_conversation_message:', err.message);
      }
    });

    // Xử lý gửi tin nhắn hỗ trợ từ admin/manager hoặc customer
    socket.on('send_support_message', async (message) => {
      try {
        console.log('Received send_support_message:', message);

        const { conversationId, sender, content, type, created_at } = message;

        // Kiểm tra dữ liệu sender chi tiết
        if (!sender || !sender.id || !sender.name) {
          throw new Error('Invalid sender data: Missing id or name');
        }

        if (!conversationId) {
          throw new Error('Conversation ID is required');
        }

        const conversation = await Conversation.findById(conversationId).populate('participants.userId');
        if (!conversation) {
          throw new Error(`Conversation with ID ${conversationId} not found`);
        }
        console.log('Conversation data:', conversation);

        let receiverId;
        const participants = conversation.participants;
        for (const participant of participants) {
          if (participant.userId && participant.userId._id && participant.userId._id.toString() !== sender.id) {
            receiverId = participant.userId._id.toString();
            break;
          }
        }

        if (!receiverId) {
          throw new Error('No receiver found for this conversation');
        }
        console.log('Sender ID:', sender.id);
        console.log('Receiver ID:', receiverId);

        const newMessage = new Message({
          conversationId,
          sender: {
            userId: sender.id,
            role: sender.role || 'customer', // Mặc định role nếu không có
          },
          content: type === 'text' ? content : undefined,
          type,
          imageUrl: type === 'image' ? content : undefined,
          isRead: false,
          created_at: created_at || new Date(),
        });

        await newMessage.save();

        const socketMessage = {
          id: newMessage._id.toString(),
          conversationId,
          sender: {
            id: sender.id,
            role: sender.role || 'customer',
            name: sender.name,
          },
          content,
          type,
          created_at: created_at || new Date().toISOString(),
          isRead: false,
          receiverId,
        };

        io.to(conversationId).emit('new_message', socketMessage);

        if (receiverId && receiverId !== sender.id) {
          io.to(receiverId).emit('new_message', socketMessage);
          console.log(`Support message sent to conversation ${conversationId} and user ${receiverId}:`, socketMessage);
        } else {
          console.log(`Support message sent to conversation ${conversationId} (no receiverId available):`, socketMessage);
        }
      } catch (err) {
        console.error('Error in send_support_message:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = handleSocket;