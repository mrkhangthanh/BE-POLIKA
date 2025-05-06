import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
  withCredentials: true,
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

  // Tham gia phòng hội thoại hỗ trợ
  const joinConversation = (conversationId) => {
    socket.emit('join_conversation', conversationId);
  };

  // Rời phòng hội thoại hỗ trợ
  const leaveConversation = (conversationId) => {
    socket.emit('leave_conversation', conversationId);
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

  // Gửi tin nhắn (hỗ trợ cả hội thoại hỗ trợ và chat đơn hàng)
  const sendMessage = (messageData) => {
    socket.emit('send_message', messageData);
  };

  // Rời phòng chat đơn hàng
  const leaveChatRoom = () => {
    socket.off('chat_history');
    socket.off('new_message');
    setChatMessages([]);
  };

  // Lắng nghe tin nhắn mới
  const onNewMessage = (callback) => {
    socket.on('new_message', (message) => {
      setChatMessages((prev) => [...prev, message]);
      callback(message);
    });

    return () => {
      socket.off('new_message');
    };
  };

  return { 
    orders, 
    chatMessages, 
    joinUserRoom, 
    joinConversation, 
    leaveConversation, 
    joinChatRoom, 
    sendMessage, 
    leaveChatRoom, 
    onNewMessage 
  };
};

export default useSocket;