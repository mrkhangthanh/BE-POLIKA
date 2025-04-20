const { validationResult } = require('express-validator');
const ServiceType = require('../../order/models/serviceType');

const updateCategoryService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { value, label, isActive } = req.body;

    const serviceType = await ServiceType.findById(id);
    if (!serviceType) {
      return res.status(404).json({ error: 'Danh mục dịch vụ không tồn tại.' });
    }

    if (value && value !== serviceType.value) {
      const existingServiceType = await ServiceType.findOne({ value });
      if (existingServiceType) {
        return res.status(400).json({ error: 'Giá trị (value) đã tồn tại.' });
      }
    }

    if (value) serviceType.value = value;
    if (label) serviceType.label = label;
    if (isActive !== undefined) serviceType.isActive = isActive;

    const updatedServiceType = await serviceType.save();
    res.status(200).json({ success: true, service_type: updatedServiceType });
  } catch (err) {
    console.error('Error in updateCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = updateCategoryService;