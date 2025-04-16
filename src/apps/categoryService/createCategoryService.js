const { validationResult } = require('express-validator');
const ServiceType = require('../order/models/serviceType');

const createCategoryService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { value, label, isActive } = req.body;

    const existingServiceType = await ServiceType.findOne({ value });
    if (existingServiceType) {
      return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
    }

    const newServiceType = new ServiceType({
      value,
      label,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedServiceType = await newServiceType.save();
    res.status(201).json({ success: true, service_type: savedServiceType });
  } catch (err) {
    console.error('Error in createCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = createCategoryService;