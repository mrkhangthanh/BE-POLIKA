const ServiceRequestModel = require('../../models/serviceRequest');
const ServiceCategoryModel = require('../../models/ServiceCategory');
const CustomerModel = require('../../models/customer');
const logger = require('../../../common/logger'); // Giả định bạn có logger (ví dụ: winston)

// Tạo yêu cầu dịch vụ mới
exports.createServiceRequest = async (req, res) => {
  try {
    // 1. Kiểm tra lỗi validation từ middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      // Note: Trả về lỗi 400 nếu dữ liệu không hợp lệ (ví dụ: thiếu trường bắt buộc).
    }

    // 2. Kiểm tra xác thực và phân quyền
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
      // Note: Trả về lỗi 401 nếu người dùng chưa đăng nhập (req.user từ authMiddleware).
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can create service requests.' });
      // Note: Trả về lỗi 403 nếu người dùng không phải là 'customer'.
    }

    // 3. Kiểm tra thông tin khách hàng (name và phone_number)
    const customer = await CustomerModel.findById(req.user.id, 'name phone_number')
      .lean()
      .exec();
    if (!customer || !customer.name || !customer.phone_number) {
      return res.status(400).json({ error: 'Customer profile incomplete. Please update your name and phone number.' });
      // Note: Đảm bảo khách hàng có đầy đủ thông tin trước khi tạo yêu cầu.
    }

    // 4. Lấy dữ liệu từ body
    const { service_type, description, address, priority, preferred_date, estimated_cost } = req.body;

    // 5. Kiểm tra tính hợp lệ của service_type (tối ưu với select và lean)
    const category = await ServiceCategoryModel.findById(service_type, 'name active')
      .lean()
      .exec();
    if (!category || !category.active) {
      return res.status(400).json({ error: 'Invalid or inactive service type' });
      // Note: Kiểm tra loại dịch vụ có tồn tại và được kích hoạt. Sử dụng .select('name active') để giảm tải dữ liệu.
    }

    // 6. Tạo và lưu ServiceRequest
    const serviceRequest = new ServiceRequestModel({
      customer_id: req.user.id,
      service_type,
      description,
      address,
      priority,
      preferred_date,
      estimated_cost,
    });

    const savedServiceRequest = await serviceRequest.save();

    // 7. Populate dữ liệu để trả về thông tin chi tiết
    const populatedServiceRequest = await ServiceRequestModel.findById(savedServiceRequest._id)
      .populate('customer_id', 'name email phone_number') // Lấy thông tin khách hàng: name, email, phone_number
      .populate('technician_id', 'name phone_number') // Lấy thông tin thợ (nếu có): name, phone_number
      .populate('service_type', 'name') // Lấy tên loại dịch vụ
      .lean();

    // 8. Trả về kết quả
    res.status(201).json(populatedServiceRequest);
    logger.info(`Service request created successfully by customer ${req.user.id}`, { serviceRequestId: savedServiceRequest._id });
    // Note: Trả về status 201 (Created) với dữ liệu đầy đủ. Ghi log để theo dõi.

  } catch (err) {
    logger.error('Error creating service request', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error', details: err.message });
    // Note: Trả về lỗi 500 với thông tin chi tiết, tránh lộ stack trace nhạy cảm.
  }
};