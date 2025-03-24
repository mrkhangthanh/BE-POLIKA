const UserModel = require('../../models/user');
const logger = require('../../../libs/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');


// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = identifier || email;

    // [SỬA] Tách biệt lỗi email/số điện thoại không tồn tại và mật khẩu sai
    const user = await UserModel.findOne({
      $or: [{ email: loginValue }, { phone_number: loginValue }],
    }).lean();
    if (!user) {
      return res.status(401).json({ error: 'Email or phone number does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await UserModel.updateOne({ _id: user._id }, { last_login: new Date() });

    const loginMethod = /^\S+@\S+\.\S+$/.test(loginValue) ? 'email' : 'phone_number';
    logger.info(`User logged in: ${loginValue} (ID: ${user._id}) via ${loginMethod}`);

    res.status(200).json({ success: true, token, user });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Đăng ký (cho khách hàng)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, address, avatar, referred_by } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone_number }] }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already exists.' });
    }

    // Kiểm tra referred_by (nếu có)
    if (referred_by) {
      const referrer = await UserModel.findById(referred_by).lean();
      if (!referrer || referrer.role !== 'agent') {
        return res.status(400).json({ error: 'Invalid referrer. Referrer must be an agent.' });
      }
    }

    const userData = {
      name,
      email,
      password,
      phone_number,
      role: 'customer',
      address,
      avatar: avatar || null,
      referred_by: referred_by || null,
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

 // [THÊM] Ghi log đăng ký
    logger.info(`User registered: ${email} (ID: ${savedUser._id})`);

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, token, user: savedUser });
  } catch (err) {
    // [THÊM] Ghi log lỗi
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
// [THÊM] Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const loginValue = identifier || email;

    const user = await UserModel.findOne({
      $or: [{ email: loginValue }, { phone_number: loginValue }],
    });
    if (!user) {
      return res.status(404).json({ error: 'Email or phone number does not exist.' });
    }

    // Tạo token reset mật khẩu (hết hạn sau 15 phút)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Lưu token vào database
    await UserModel.updateOne(
      { _id: user._id },
      { reset_password_token: resetToken, reset_password_expires: Date.now() + 15 * 60 * 1000 }
    );

    // Giả lập gửi email (trong thực tế, bạn sẽ dùng một dịch vụ email như nodemailer)
    const resetLink = `http://localhost:8000/api/v1/reset-password?token=${resetToken}`;
    logger.info(`Password reset link for ${user.email}: ${resetLink}`);

    res.status(200).json({ success: true, message: 'Password reset link has been sent to your email.' });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM] Reset mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findOne({
      _id: decoded.id,
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};