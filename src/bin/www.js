const express = require('express');
const app = require('../apps/app');
const config = require('config');

const server = app.listen(port = config.get("app.port"), (req, res)=> {
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