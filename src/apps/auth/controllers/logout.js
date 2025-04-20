const UserModel = require('../models/user');
const logger = require('../../../libs/logger');

const jwt = require('jsonwebtoken');
const { addToBlacklist } = require('../../../common/init.redis');


const logout = async (req, res) => {
  try {
    const token = req.token;
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentTime = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - currentTime;

    await addToBlacklist(token, expiresIn);

    const user = await UserModel.findById(decoded.id);
    if (user.refreshToken) {
      const refreshToken = user.refreshToken;
      const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const refreshExpiresIn = refreshDecoded.exp - currentTime;
      await addToBlacklist(refreshToken, refreshExpiresIn);
      user.refreshToken = null;
      await user.save();
    }

    logger.info(`User ${user.email || user.phone_number} (ID: ${user._id}) logged out.`);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = logout;