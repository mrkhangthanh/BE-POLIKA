// auth/controllers/authController.js
const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const { addToBlacklist } = require('../../../common/init.redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Hàm tách biệt để cập nhật hồ sơ (có thể tái sử dụng)
const updateUserProfile = async (userId, data) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.address !== undefined) user.address = data.address;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    const updatedUser = await user.save();

    logger.info(`Profile updated for user: ${user.email || user.phone_number} (ID: ${user._id})`);

    return {
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser.toObject(),
    };
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    throw new Error(err.message || 'Internal server error');
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = identifier || email;

    if (!loginValue || !password) {
      return res.status(400).json({
        errorCode: 'MISSING_FIELDS',
        errorMessage: 'Vui lòng nhập email hoặc số điện thoại và mật khẩu.',
      });
    }

    console.log(`Attempting login with identifier: ${loginValue}`);

    const user = await UserModel.findOne({
      $or: [{ email: loginValue }, { phone_number: loginValue }],
    })
      .select('+password')
      .lean();

    if (!user) {
      console.log(`User not found for identifier: ${loginValue}`);
      return res.status(401).json({
        errorCode: 'INVALID_IDENTIFIER',
        errorMessage: 'Email hoặc số điện thoại không tồn tại.',
        field: 'identifier',
      });
    }

    console.log(`User found: ${user._id}, email: ${user.email}, phone: ${user.phone_number}`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Password mismatch for user: ${user._id}`);
      return res.status(401).json({
        errorCode: 'INVALID_PASSWORD',
        errorMessage: 'Mật khẩu không đúng.',
        field: 'password',
      });
    }

    if (user.status !== 'active') {
      console.log(`User account is locked: ${user._id}`);
      return res.status(403).json({
        errorCode: 'ACCOUNT_LOCKED',
        errorMessage: 'Tài khoản đã bị khóa.',
        field: 'identifier',
      });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    await UserModel.updateOne(
      { _id: user._id },
      {
        refresh_token: refreshToken,
        refresh_token_expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        last_login: new Date(),
      }
    ).catch(err => {
      console.error(`Error updating user ${user._id}:`, err);
      throw new Error('Không thể cập nhật thông tin đăng nhập.');
    });

    const { password: _, refresh_token: __, ...userData } = user;

    const loginMethod = /^\S+@\S+\.\S+$/.test(loginValue) ? 'email' : 'phone_number';
    logger.info(`User logged in: ${loginValue} (ID: ${user._id}) via ${loginMethod}`);

    console.log(`Login successful for user: ${user._id}`);

    res.status(200).json({ success: true, accessToken, refreshToken, user: userData });
  } catch (err) {
    console.error(`Login error for identifier ${req.body.identifier || req.body.email}:`, err);
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({
      errorCode: 'SERVER_ERROR',
      errorMessage: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.',
    });
  }
};
// Đăng ký (cho khách hàng và thợ)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, address, avatar, referred_by, role, services } = req.body;

    // Kiểm tra vai trò hợp lệ
    const allowedRoles = ['customer', 'technician'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ. Chỉ chấp nhận customer hoặc technician.' });
    }

    // Nếu là thợ, kiểm tra xem có services không
    if (role === 'technician' && (!services || !Array.isArray(services) || services.length === 0)) {
      return res.status(400).json({ error: 'Thợ phải chọn ít nhất một lĩnh vực công việc.' });
    }

    // Kiểm tra email hoặc phone_number đã tồn tại
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
      name: name || undefined,
      email: email || undefined,
      password,
      phone_number: phone_number || undefined,
      role: role,
      address: address || {},
      avatar: avatar || null,
      referred_by: referred_by || null,
      services: role === 'technician' ? services : [], // Lưu danh sách services nếu là thợ
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

    logger.info(`User registered: ${email || phone_number} (ID: ${savedUser._id})`);

    res.status(201).json({ success: true, accessToken, refreshToken, user: savedUser.toObject() });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Quên mật khẩu
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

// Reset mật khẩu
exports.resetPassword = async (req, res) => {
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

    const userId = user._id.toString();
    const sessions = await redisClient.lRange(`sessions:${userId}`, 0, -1);

    const currentTime = Math.floor(Date.now() / 1000);
    for (const session of sessions) {
      const { accessToken, refreshToken } = JSON.parse(session);

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

    await redisClient.del(`sessions:${userId}`);

    if (user.refreshToken) {
      user.refreshToken = null;
    }

    await user.save();

    logger.info(`Password reset successful for user: ${user.email} (ID: ${user._id})`);

    res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in again.' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Làm mới access token
exports.refreshToken = async (req, res) => {
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

// Đăng xuất
exports.logout = async (req, res) => {
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

// Xem lịch sử trạng thái
exports.getStatusHistory = async (req, res) => {
  try {
    const { userId } = req.query;

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

// Cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user._id;
    const { name, address, avatar } = req.body;

    const result = await updateUserProfile(userId, { name, address, avatar });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy thông tin người dùng
exports.getUserInfo = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select('name email phone_number address role specialization services');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Export updateUserProfile để sử dụng ở các file khác
exports.updateUserProfile = updateUserProfile;