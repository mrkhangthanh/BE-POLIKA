const express = require('express');
const cors = require('cors');
const app = express();
const config = require('config');

app.use(cors({
    origin: 'http://localhost:3000', // Chỉ cho phép origin từ localhost:3000
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE','OPTIONS'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
  }));


app.use(express.json());

app.use(`${config.get('app.prefixApiVersion')}`,require(`${__dirname}/../routers/web`));


module.exports = app;