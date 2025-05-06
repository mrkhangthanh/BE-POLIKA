const jwt = require('jsonwebtoken');
const User = require('../auth/models/user');

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received in authMiddleware:', token);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Decoded token:', decoded);

    // Kiểm tra token hết hạn
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ message: 'Token has expired' });
    }

    // Tìm user trong database
    const user = await User.findById(decoded.id).select('name role status');
    console.log('User found:', user);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Kiểm tra trạng thái user
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    // Gắn user vào req
    req.user = {
      _id: user._id.toString(),
      name: user.name,
      role: user.role,
      status: user.status,
    };
    console.log('req.user set in authMiddleware:', req.user);

    next();
  } catch (error) {
    console.error('Error in authMiddleware:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;