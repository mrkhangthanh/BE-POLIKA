const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const {addToBlacklist} = require('../../../common/init.redis');
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

    // Tạo access token (hết hạn sau 1 giờ)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // [THÊM] Tạo refresh token (hết hạn sau 7 ngày)
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // [THÊM] Lưu refresh token vào database
    await UserModel.updateOne(
      { _id: user._id },
      {
        refresh_token: refreshToken,
        refresh_token_expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 ngày
        last_login: new Date(),
      }
    );

    const loginMethod = /^\S+@\S+\.\S+$/.test(loginValue) ? 'email' : 'phone_number';
    logger.info(`User logged in: ${loginValue} (ID: ${user._id}) via ${loginMethod}`);

 // [SỬA] Trả về cả access token và refresh token
 res.status(200).json({ success: true, accessToken, refreshToken, user: user });
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

    // [SỬA] Kiểm tra email hoặc phone_number đã tồn tại
    const queryConditions = [];
    if (email) queryConditions.push({ email });
    if (phone_number) queryConditions.push({ phone_number });

    if (queryConditions.length > 0) {
      const existingUser = await UserModel.findOne({ $or: queryConditions }).lean();
      if (existingUser) {
        return res.status(400).json({ error: 'Email or phone number already exists.' });
      }
    }

    // Kiểm tra referred_by (nếu có)
    if (referred_by) {
      const referrer = await UserModel.findById(referred_by).lean();
      if (!referrer || referrer.role !== 'agent') {
        return res.status(400).json({ error: 'Invalid referrer. Referrer must be an agent.' });
      }
    }

    // Tạo userData với các trường không bắt buộc được xử lý
    const userData = {
      name: name || undefined, // Không bắt buộc
      email: email || undefined, // Một trong email hoặc phone_number phải có (đã được validate)
      password,
      phone_number: phone_number || undefined,
      role: 'customer',
      address: address || {}, // Không bắt buộc, để trống nếu không có
      avatar: avatar || null,
      referred_by: referred_by || null,
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    // Tạo access token và refresh token sau khi đăng ký
    const accessToken = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Lưu refresh token vào database
    await UserModel.updateOne(
      { _id: savedUser._id },
      {
        refresh_token: refreshToken,
        refresh_token_expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 ngày
      }
    );

    // Ghi log đăng ký với email hoặc phone_number
    logger.info(`User registered: ${email || phone_number} (ID: ${savedUser._id})`);

    // Trả về cả access token và refresh token
    res.status(201).json({ success: true, accessToken, refreshToken, user: savedUser.toObject() });
  } catch (err) {
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

    // [THÊM] Đánh dấu tất cả token cũ là dirty và xóa các phiên đăng nhập
    const userId = user._id.toString();
    const sessions = await redisClient.lRange(`sessions:${userId}`, 0, -1);

    // Thêm tất cả token vào blacklist
    const currentTime = Math.floor(Date.now() / 1000);
    for (const session of sessions) {
      const { accessToken, refreshToken } = JSON.parse(session);

      // Thêm access token vào blacklist
      if (accessToken) {
        try {
          const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET);
          const expiresIn = decodedAccess.exp - currentTime;
          if (expiresIn > 0) {
            await addToBlacklist(accessToken, expiresIn);
          }
        } catch (err) {
          logger.warn(`Invalid access token in session for user ${userId}: ${err.message}`);
        }
      }

      // Thêm refresh token vào blacklist
      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_SECRET);
          const refreshExpiresIn = decodedRefresh.exp - currentTime;
          if (refreshExpiresIn > 0) {
            await addToBlacklist(refreshToken, refreshExpiresIn);
          }
        } catch (err) {
          logger.warn(`Invalid refresh token in session for user ${userId}: ${err.message}`);
        }
      }
    }

    // Xóa tất cả phiên đăng nhập trong Redis
    await redisClient.del(`sessions:${userId}`);

    // Xóa refresh token trong UserModel (nếu có)
    if (user.refreshToken) {
      user.refreshToken = null;
    }

    // Lưu user
    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in again.' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM] Làm mới access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Xác thực refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await UserModel.findOne({
      _id: decoded.id,
      refresh_token: refreshToken,
      refresh_token_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Tạo access token mới
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`Access token refreshed for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    logger.error(`Refresh token error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM hoặc CẬP NHẬT] API đăng xuất
exports.logout = async (req, res) => {
  try {
    const token = req.token; // Lấy token từ req (đã được gán trong authMiddleware)
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Xác minh token để lấy thời gian hết hạn
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tính thời gian còn lại của token (để set TTL trong Redis)
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - currentTime;

    // Thêm access token vào blacklist
    await addToBlacklist(token, expiresIn);

    // [TÙY CHỌN] Nếu bạn lưu refresh token trong database, có thể xóa hoặc đánh dấu nó là không hợp lệ
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
// [THÊM] API xem lịch sử trạng thái
exports.getStatusHistory = async (req, res) => {
  try {
    const { userId } = req.query;

    // Tìm user và chỉ lấy trường status_history
    const user = await UserModel.findById(userId, 'status status_history');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    logger.info(`Status history viewed for user: ${userId} by admin (ID: ${req.user._id})`);

    res.status(200).json({
      success: true,
      currentStatus: user.status,
      statusHistory: user.status_history,
    });
  } catch (err) {
    logger.error(`Get status history error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// [THÊM] API cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user._id; // Lấy từ authMiddleware
    const { name, address, avatar } = req.body;

    // Tìm user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cập nhật các trường được phép
    if (name !== undefined) user.name = name;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    logger.info(`Profile updated for user: ${user.email || user.phone_number} (ID: ${user._id})`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toObject(),
    });
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};