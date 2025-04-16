const UserModel = require('../../auth/models/user');
const ServiceTypeModel = require('../../categoryService/models/serviceType'); // Thêm model ServiceType để kiểm tra ObjectId
const { body, validationResult } = require('express-validator');
const pagination = require('../../../libs/pagination');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Tạo user (cho admin)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone_number, role, address, services, referred_by, avatar } = req.body;

    // Kiểm tra email hoặc số điện thoại đã tồn tại
    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone_number }] }).lean();
    if (existingUser) {
      return res.status(400).json({ error: 'Email or phone number already exists.' });
    }

    // Kiểm tra services nếu role là technician
    if (role === 'technician') {
      if (!services || !Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ error: 'Services are required for technician role.' });
      }

      // Kiểm tra tính hợp lệ của các ObjectId trong services
      if (!services.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: 'Invalid service ID in services array.' });
      }

      // Kiểm tra xem các service ID có tồn tại trong collection ServiceType không
      const validServices = await ServiceTypeModel.find({ _id: { $in: services } });
      if (validServices.length !== services.length) {
        return res.status(400).json({ error: 'One or more service IDs do not exist.' });
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
      services: role === 'technician' ? services : undefined,
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

    // Validation cho page và limit
    if (isNaN(page) || isNaN(limit)) {
      return res.status(400).json({ error: 'Page and limit must be numbers.' });
    }
    if (parseInt(limit) > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100.' });
    }

    // Validation và xử lý sort
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
      .sort(sort)
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
    const { name, phone_number, role, address, services, status, avatar } = req.body;

    // Kiểm tra xem user có tồn tại không
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Kiểm tra services nếu role là technician
    if (role === 'technician' && services) {
      if (!Array.isArray(services)) {
        return res.status(400).json({ error: 'Services must be an array.' });
      }

      // Kiểm tra tính hợp lệ của các ObjectId trong services
      if (services.length > 0 && !services.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: 'Invalid service ID in services array.' });
      }

      // Kiểm tra xem các service ID có tồn tại trong collection ServiceType không
      if (services.length > 0) {
        const validServices = await ServiceTypeModel.find({ _id: { $in: services } });
        if (validServices.length !== services.length) {
          return res.status(400).json({ error: 'One or more service IDs do not exist.' });
        }
      }
    }

    // Cập nhật thông tin user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name || user.name,
          phone_number: phone_number || user.phone_number,
          role: role || user.role,
          address: (role === 'customer' || role === 'technician') ? (address || user.address) : undefined,
          services: role === 'technician' ? (services !== undefined ? services : user.services) : undefined,
          status: status || user.status,
          avatar: avatar !== undefined ? avatar : user.avatar,
        },
      },
      { new: true, runValidators: true } // Trả về user đã cập nhật và chạy validation
    );

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Error:', err);
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