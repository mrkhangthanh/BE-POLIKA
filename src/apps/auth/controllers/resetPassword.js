const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const jwt = require('jsonwebtoken');
const { addToBlacklist } = require('../../../common/init.redis');


const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findOne({
      _id: decoded.id,
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    user.password = newPassword;
    user.reset_password_token = null;
    user.reset_password_expires = null;

    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in again.' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = resetPassword;