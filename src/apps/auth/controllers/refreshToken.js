const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const jwt = require('jsonwebtoken');

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await UserModel.findOne({
      _id: decoded.id,
      refresh_token: refreshToken,
      refresh_token_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`Access token refreshed for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    logger.error(`Refresh token error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = refreshToken;