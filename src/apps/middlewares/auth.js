const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const config = require('config');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).lean();

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Access denied. Your account is inactive.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.', details: err.message });
  }
};

module.exports = authMiddleware;