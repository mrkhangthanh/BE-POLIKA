const UserModel = require('../models/user');
const logger = require('../../../libs/logger');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, address, avatar, referred_by, role, services } = req.body;

    const allowedRoles = ['customer', 'technician'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ. Chỉ chấp nhận customer hoặc technician.' });
    }

    if (role === 'technician' && (!services || !Array.isArray(services) || services.length === 0)) {
      return res.status(400).json({ error: 'Thợ phải chọn ít nhất một lĩnh vực công việc.' });
    }

    const queryConditions = [];
    if (email) queryConditions.push({ email });
    if (phone_number) queryConditions.push({ phone_number });

    if (queryConditions.length > 0) {
      const existingUser = await UserModel.findOne({ $or: queryConditions }).lean();
      if (existingUser) {
        return res.status(400).json({ error: 'Email or phone number already exists.' });
      }
    }

    const userData = {
      name: name || undefined,
      email: email || undefined,
      password,
      phone_number: phone_number || undefined,
      role: role,
      address: address || {},
      avatar: avatar || null,
      referred_by: referred_by || null,
      services: role === 'technician' ? services : [],
    };

    const user = new UserModel(userData);
    const savedUser = await user.save();

    const accessToken = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    await UserModel.updateOne(
      { _id: savedUser._id },
      {
        refresh_token: refreshToken,
        refresh_token_expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }
    );

    logger.info(`User registered: ${email || phone_number} (ID: ${savedUser._id})`);

    res.status(201).json({ success: true, accessToken, refreshToken, user: savedUser.toObject() });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = register;