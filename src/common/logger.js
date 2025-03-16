const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

// Định dạng log tùy chỉnh
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Tạo logger
const logger = createLogger({
  level: 'info', // Mức log thấp nhất (info, warn, error)
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Thêm timestamp
    colorize(), // Màu cho log trên console
    logFormat // Áp dụng định dạng tùy chỉnh
  ),
  transports: [
    // Ghi log ra console
    new transports.Console(),
    // Ghi log ra file (lưu trữ để phân tích sau)
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;