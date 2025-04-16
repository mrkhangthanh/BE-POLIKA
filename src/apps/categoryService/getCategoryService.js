const ServiceType = require('../order/models/serviceType');

const getCategoryService = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find();
    res.status(200).json({ success: true, service_types: serviceTypes });
  } catch (err) {
    console.error('Error in getCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = getCategoryService;