const UserModel = require('../../auth/models/user');
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination');
const bcrypt = require('bcryptjs');

// Tạo user (cho admin)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, role, address, specialization, referred_by, avatar } = req.body;

    // Kiểm tra email hoặc số điện thoại đã tồn tại
    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone_number }] }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already exists.' });
    }

    // 🔴 [XÓA] Bỏ kiểm tra bắt buộc address
    // if ((role === 'customer' || role === 'technician') && (!address || !address.street || !address.city || !address.district || !address.ward)) {
    //   return res.status(400).json({ error: 'Address (street, city, district, ward) is required for customer and technician roles.' });
    // }

    // Kiểm tra specialization nếu role là technician
    if (role === 'technician') {
      if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
        return res.status(400).json({ error: 'Specialization is required for technician role.' });
      }
      const validSpecializations = ['plumbing', 'electrical', 'carpentry', 'hvac'];
      if (!specialization.every(spec => validSpecializations.includes(spec))) {
        return res.status(400).json({ error: 'Invalid specialization. Must be one of: plumbing, electrical, carpentry, hvac' });
      }
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone_number,
      role,
      address, // address có thể là null
      specialization: role === 'technician' ? specialization : undefined,
      referred_by,
      avatar,
      status: 'active',
    });

    await newUser.save();

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy danh sách user
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // [Cải thiện 5.2] Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // [Cải thiện 5.2] Validation và xử lý sort
    const allowedSortFields = ['name', 'email', 'phone_number', 'created_at', 'role'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: `SortBy must be one of: ${allowedSortFields.join(', ')}` });
    }
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({ error: 'SortOrder must be "asc" or "desc".' });
    }
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {};
    const paginationInfo = await pagination(page, limit, UserModel, query);

    const users = await UserModel.find()
      .sort(sort) // [Cải thiện 5.2] Áp dụng sort
      .skip((paginationInfo.currentPage - 1) * paginationInfo.pageSize)
      .limit(paginationInfo.pageSize)
      .lean();

    res.status(200).json({ success: true, users, pagination: paginationInfo });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Lấy thông tin user theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone_number, role, address, specialization, status, avatar } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (role === 'technician' && specialization) {
      const validSpecializations = ['plumbing', 'electrical', 'carpentry', 'hvac'];
      if (!specialization.every(spec => validSpecializations.includes(spec))) {
        return res.status(400).json({ error: 'Invalid specialization. Must be one of: plumbing, electrical, carpentry, hvac' });
      }
    }

    user.name = name || user.name;
    user.phone_number = phone_number || user.phone_number;
    user.role = role || user.role;
    user.address = (role === 'customer' || role === 'technician') ? address || user.address : undefined;
    user.specialization = role === 'technician' ? specialization || user.specialization : undefined;
    user.status = status || user.status;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    const updatedUser = await user.save();
    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Xóa user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.remove();
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};