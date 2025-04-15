// libs/socketHandlers.js
const ChatMessage = require('../apps/chatMessage/models/ChatMessage'); // Mô hình cho tin nhắn chat (sẽ tạo sau)
const Order = require('../apps/order/models/order'); // Mô hình cho đơn hàng (sẽ tạo sau)

const handleSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Xử lý khi user tham gia (join) dựa trên userId
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Xử lý live update đơn hàng
    socket.on('new_order', async (newOrder) => {
      try {
        // Lưu đơn hàng mới vào database
        const order = new Order(newOrder);
        await order.save();

        // Lấy danh sách đơn hàng mới nhất
        const updatedOrders = await Order.find().sort({ created_at: -1 });

        // Gửi cập nhật đến tất cả client
        io.emit('order_update', updatedOrders);
      } catch (err) {
        console.error('Error in new_order:', err);
      }
    });

    // Xử lý tham gia phòng chat của đơn hàng
    socket.on('join_chat', async ({ orderId, userId }) => {
      const room = `chat_${orderId}`;
      socket.join(room);
      console.log(`${userId} joined chat room for order ${orderId}`);

      // Lấy lịch sử chat từ database
      try {
        let chat = await ChatMessage.findOne({ orderId });
        if (!chat) {
          chat = new ChatMessage({ orderId, messages: [] });
          await chat.save();
        }
        socket.emit('chat_history', chat.messages || []);
      } catch (err) {
        console.error('Error in join_chat:', err);
      }
    });

    // Xử lý gửi tin nhắn
    socket.on('send_message', async ({ orderId, userId, message }) => {
      const room = `chat_${orderId}`;
      const newMessage = {
        userId,
        message,
        timestamp: new Date(),
      };

      try {
        // Lưu tin nhắn vào database
        let chat = await ChatMessage.findOne({ orderId });
        if (!chat) {
          chat = new ChatMessage({ orderId, messages: [] });
        }
        chat.messages.push(newMessage);
        await chat.save();

        // Gửi tin nhắn đến tất cả người dùng trong phòng chat
        io.to(room).emit('new_message', newMessage);
      } catch (err) {
        console.error('Error in send_message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = handleSocket;