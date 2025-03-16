const Customer = require('../../models/customer');
const pagination = require('../../../libs/pagination');

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const paginationInfo = await pagination(page, limit, Customer, {});
    const skip = (page - 1) * limit;
    const data = await Customer.find({})
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Danh sách khách hàng',
      data,
      pagination: paginationInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCustomers };