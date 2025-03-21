require('dotenv').config();
const server = require('../apps/app');
const express = require('express');
const config = require('config');


const port = process.env.PORT || config.get('app.port') || 8000;

server.listen(port, ()=> {
    console.log(`Server is running on port ${port}`);
});

// Xử lý lỗi khi port bị chiếm dụng
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      throw err;
    }
  });