const { validationResult } = require('express-validator');
const PublicLocationFilterService = require('../services/publicLocationFilterService');


const filterPublicOrdersByCity = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', service_type, city } = req.query;
  
      const { orders, total } = await PublicLocationFilterService.filterPublicOrdersByCity({
        page,
        limit,
        sortBy,
        sortOrder,
        service_type,
        city,
      });
  
      res.status(200).json({
        success: true,
        orders,
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          totalRows: total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  };
  module.exports = filterPublicOrdersByCity;