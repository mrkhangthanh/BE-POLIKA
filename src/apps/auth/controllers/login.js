const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = identifier || email;

    if (!loginValue || !password) {
      return res.status(400).json({
        errorCode: 'MISSING_FIELDS',
        errorMessage: 'Vui lòng nhập email hoặc số điện thoại và mật khẩu.',
      });
    }

    const user = await UserModel.findOne({
      $or: [{ email: loginValue }, { phone_number: loginValue }],
    })
      .select('+password')
      .lean();

    if (!user) {
      return res.status(401).json({
        errorCode: 'INVALID_IDENTIFIER',
        errorMessage: 'Email hoặc số điện thoại không tồn tại.',
        field: 'identifier',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        errorCode: 'INVALID_PASSWORD',
        errorMessage: 'Mật khẩu không đúng.',
        field: 'password',
      });
    }

    if (user.status !== 'active') {
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
    );

    const { password: _, refresh_token: __, ...userData } = user;

    logger.info(`User logged in: ${loginValue} (ID: ${user._id})`);

    res.status(200).json({ success: true, accessToken, refreshToken, user: userData });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({
      errorCode: 'SERVER_ERROR',
      errorMessage: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.',
    });
  }
};

module.exports = login;