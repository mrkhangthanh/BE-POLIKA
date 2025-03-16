/**
 * Hàm lấy thông tin phân trang
 * @param {Number} page - Số trang hiện tại
 * @param {Number} limit - Số bản ghi mỗi trang
 * @param {Model} Model - Mongoose model
 * @param {Object} [query={}] - Điều kiện lọc
 * @returns {Object} - Thông tin phân trang
 */
module.exports = async (page = 1, limit = 10, Model, query = {}) => {
    try {
      // Chuẩn hóa tham số
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
  
      // Đếm tổng số bản ghi
      const totalRows = await Model.countDocuments(query);
  
      // Tính tổng số trang
      const totalPages = Math.ceil(totalRows / limit);
  
      return {
        totalRows,
        totalPages,
        currentPage: page,
        pageSize: limit,
        next: page + 1,
        prev: page - 1,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      throw new Error(`Pagination error: ${error.message}`);
    }
  };