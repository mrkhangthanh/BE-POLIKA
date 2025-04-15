const express = require('express');
const http = require('http');
const limiter = require('../libs/rateLimit');
const cors = require('cors');
const {Server} = require('socket.io');
const config = require('config');
const handleSocket = require('../libs/socketHandlers')

// Initialize Express app
const app = express();
const server = http.createServer(app);
// const io = new Server(server);

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình CORS đầy đủ cho socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});
// <span style="color:red">[CHỈNH SỬA]</span>: Tăng timeout của server
server.keepAliveTimeout = 120000; // 120 giây
server.headersTimeout = 120000; // 120 giây



// Gọi handleSocket để xử lý các sự kiện Socket.IO
handleSocket(io);
// Socket.IO Configuration
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('join', (userId) => {
//     socket.join(userId);
//   });

//   socket.on('sendMessage', (message) => {
//     io.to(message.receiver_id).emit('newMessage', message);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// Truyền io vào router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Standard middleware
app.use(express.json());
app.use(limiter);

// Connect routers
app.use(`${config.get('app.prefixApiVersion')}`, require(`${__dirname}/../routers/index`));

// 404 handler
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = server;
