import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
  withCredentials: true, // Thêm tùy chọn gửi credentials
  extraHeaders: {
    // Nếu cần thêm header Authorization hoặc khác, có thể thêm ở đây
    // Authorization: 'Bearer token',
  },
});

const useSocket = () => {
  const [orders, setOrders] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Lắng nghe cập nhật đơn hàng
  useEffect(() => {
    socket.on('order_update', (updatedOrders) => {
      setOrders(updatedOrders);
    });

    return () => {
      socket.off('order_update');
    };
  }, []);

  // Tham gia phòng của user
  const joinUserRoom = (userId) => {
    socket.emit('join', userId);
  };

  // Tham gia phòng chat của đơn hàng
  const joinChatRoom = (orderId, userId) => {
    socket.emit('join_chat', { orderId, userId });

    socket.on('chat_history', (messages) => {
      setChatMessages(messages);
    });

    socket.on('new_message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });
  };

  // Gửi tin nhắn
  const sendMessage = (orderId, userId, message) => {
    socket.emit('send_message', { orderId, userId, message });
  };

  // Rời phòng chat
  const leaveChatRoom = () => {
    socket.off('chat_history');
    socket.off('new_message');
    setChatMessages([]);
  };

  return { orders, chatMessages, joinUserRoom, joinChatRoom, sendMessage, leaveChatRoom };
};

export default useSocket;
