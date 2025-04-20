const ServiceType = require('../../order/models/serviceType');

const deleteCategoryService = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findByIdAndDelete(id);
    if (!serviceType) {
      return res.status(404).json({ error: 'Danh mục dịch vụ không tồn tại.' });
    }

    res.status(200).json({ success: true, message: 'Danh mục dịch vụ đã được xóa.' });
  } catch (err) {
    console.error('Error in deleteCategoryService:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
module.exports = deleteCategoryService;