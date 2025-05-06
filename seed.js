
const connectDB = require('./src/common/init.myDB');
const mongoose = require('mongoose');
const User = require('./src/apps/auth/models/user');
const Conversation = require('./src/apps/conversationsMessages/models/Conversation');
const Message = require('./src/apps/conversationsMessages/models/Message');


const seedData = async () => {
  await connectDB();

  
  // Tạo người dùng
  const customer = new User({
    name: 'Nguyễn hải',
    email: 'nguyenthanhba@gmail.com',
    password: '123456789',
    role: 'customer',
    status: 'active',
  });
  const technician = new User({
    name: 'alala',
    email: 'nguyenthanh4@gmail.com',
    password: '123456789',
    role: 'admin',
    status: 'active',
  });
  await customer.save();
  await technician.save();

  // Tạo cuộc trò chuyện
  const conversation = new Conversation({
    participants: [
      { userId: customer._id, role: 'customer' },
      { userId: technician._id, role: 'admin' },
    ],
  });
  await conversation.save();

  // Tạo tin nhắn
  const message1 = new Message({
    conversationId: conversation._id,
    sender: { userId: customer._id, role: 'customer' },
    content: 'Chào bạn!',
    type: 'text',
    isRead: false,
  });
  const message2 = new Message({
    conversationId: conversation._id,
    sender: { userId: technician._id, role: 'admin' },
    content: 'Chào bạn, tôi sẽ đến trong 30 phút.',
    type: 'text',
    isRead: false,
  });
  await message1.save();
  await message2.save();

  console.log('Dữ liệu giả lập đã được tạo!');
  process.exit();
};

seedData();