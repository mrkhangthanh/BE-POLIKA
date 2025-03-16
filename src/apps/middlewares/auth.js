const jwt = require('jsonwebtoken');
const config = require('config');

module.exports =  (req, res, next) => {
  // Lấy token từ header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Xác minh token
    const decoded = jwt.verify(token, config.get('app.jwtSecret'));
    req.user = decoded; // Lưu thông tin user vào req (id, role)
    next(); // Chuyển request đến handler tiếp theo
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};