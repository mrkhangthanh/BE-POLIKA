const UserModel = require('../../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await UserModel.updateOne({ _id: user._id }, { last_login: new Date() });

    res.status(200).json({ success: true, token, user });
  } catch (err) {
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

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, token, user: savedUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};