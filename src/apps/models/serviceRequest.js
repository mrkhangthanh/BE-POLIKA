const mongoose = require('../../common/init.myDB')();

const serviceRequestSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    // Note: ID của khách hàng (Customer) tạo yêu cầu dịch vụ, tham chiếu đến model Customer. Bắt buộc để xác định ai là người yêu cầu.
  },
  technician_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    default: null,
    // Note: ID của thợ kỹ thuật (Technician) được gán để xử lý yêu cầu. Mặc định là null (chưa gán), có thể được cập nhật bởi admin hoặc hệ thống.
  },
  service_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true,
    // Note: ID của loại dịch vụ, tham chiếu đến model ServiceCategory (ví dụ: cleaning, plumbing). Bắt buộc để xác định loại dịch vụ nào được yêu cầu.
  },
  description: {
    type: String,
    required: true,
    // Note: Mô tả chi tiết về yêu cầu dịch vụ (ví dụ: "Sửa máy lạnh không lạnh"). Bắt buộc để cung cấp thông tin cho thợ.
  },
  address: {
    type: String,
    required: true,
    // Note: Địa chỉ nơi thực hiện dịch vụ (ví dụ: "123 Lê Lợi, Quận 1, TP.HCM"). Bắt buộc để thợ biết địa điểm.
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    // Note: Mức độ ưu tiên của yêu cầu (thấp, trung bình, cao). Mặc định là "medium" để sắp xếp công việc.
  },
  preferred_date: {
    type: Date,
    default: null,
    // Note: Thời gian mong muốn thực hiện dịch vụ (ví dụ: "2025-03-16T10:00:00Z"). Tùy chọn, khách hàng có thể để trống.
  },
  estimated_cost: {
    type: Number,
    default: 0,
    // Note: Chi phí dự kiến cho dịch vụ (đơn vị: VND). Mặc định là 0 nếu chưa xác định, có thể được cập nhật sau.
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    // Note: Trạng thái của yêu cầu (chờ xử lý, đã gán, đang thực hiện, hoàn thành, hủy). Mặc định là "pending".
  },
  completion_date: {
    type: Date,
    default: null,
    // Note: Thời gian hoàn thành dịch vụ, tự động gán khi status là "completed". Tùy chọn, mặc định null.
  },
  notes: {
    type: String,
    default: '',
    // Note: Ghi chú từ thợ kỹ thuật (ví dụ: "Cần mang thêm dụng cụ chống thấm"). Tùy chọn, mặc định rỗng.
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
    // Note: Đánh giá của khách hàng sau khi dịch vụ hoàn thành (từ 1 đến 5 sao). Tùy chọn, mặc định null (chưa đánh giá).
  },
  feedback: {
    type: String,
    default: '',
    // Note: Phản hồi của khách hàng sau khi dịch vụ hoàn thành (ví dụ: "Rất hài lòng"). Tùy chọn, mặc định rỗng.
  },
}, { timestamps: true });

const ServiceRequestModel = mongoose.model('ServiceRequests', serviceRequestSchema, 'serviceRequests');
module.exports = ServiceRequestModel;