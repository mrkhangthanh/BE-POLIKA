const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const jwt = require('jsonwebtoken');

const forgotPassword = async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const loginValue = identifier || email;

    const user = await UserModel.findOne({
      $or: [{ email: loginValue }, { phone_number: loginValue }],
    });
    if (!user) {
      return res.status(404).json({ error: 'Email or phone number does not exist.' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    await UserModel.updateOne(
      { _id: user._id },
      { reset_password_token: resetToken, reset_password_expires: Date.now() + 15 * 60 * 1000 }
    );

    const resetLink = `http://localhost:8000/api/v1/reset-password?token=${resetToken}`;
    logger.info(`Password reset link for ${user.email}: ${resetLink}`);

    res.status(200).json({ success: true, message: 'Password reset link has been sent to your email.' });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = forgotPassword;