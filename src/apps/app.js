const express = require('express');
const http = require('http');
const limiter = require('../libs/rateLimit')
const cors = require('cors');
const {Server} = require('socket.io');
// Khởi tạo Express app trước
const app = express();
const config = require('config');
// Khởi tạo server và Socket.IO sau khi app đã được khởi tạo
const server = http.createServer(app);
const io = new Server(server);


app.use(cors({
    origin: 'http://localhost:3000', // Chỉ cho phép origin từ localhost:3000
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE','OPTIONS'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
  }));

  // Cấu hình Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.receiver_id).emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(limiter);
app.use(express.json());

app.use(`${config.get('app.prefixApiVersion')}`,require(`${__dirname}/../routers/web`));


module.exports = server;