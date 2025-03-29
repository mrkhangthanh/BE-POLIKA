const jwt = require('jsonwebtoken');
const UserModel = require('../auth/models/user');
const {isBlacklisted} = require('../../common/init.redis')
const config = require('config');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    console.log('Auth Header:', token); // Thêm log
    // [THÊM] Kiểm tra token trong blacklist
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).lean();
    console.log('Decoded Token:', decoded); // Thêm log
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.log('User:', user); // Thêm log
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Access denied. Your account is inactive.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    // [CẬP NHẬT] Xử lý lỗi chi tiết hơn
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', details: err.message });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.', details: err.message });
    }
    return res.status(401).json({ error: 'Authentication failed.', details: err.message });
  }
};

module.exports = authMiddleware;