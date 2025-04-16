const express = require('express');
const router = express.Router();
const categoryServiceControllers = require('../categoryServiceController');
// const customerValidator = require('../validators/customerValidator');
const authMiddleware = require('../../middlewares/auth');
// const handleValidationErrors = require('../../middlewares/validationError');
// const requireRole = require('../../middlewares/requireRole');


// Route mới: Lấy danh sách dịch vụ (service_types)
// router.get('/category-service', categoryServiceControllers.getCategoryService); 
// // Route mới
// router.post(
//   '/category-service',
//   authMiddleware,
//   // [
//   //   body('value').notEmpty().withMessage('Giá trị (value) là bắt buộc.'),
//   //   body('label').notEmpty().withMessage('Tên danh mục (label) là bắt buộc.'),
//   //   body('isActive').optional().isBoolean().withMessage('Trạng thái (isActive) phải là boolean.'),
//   // ],
//   categoryServiceControllers.createCategoryService
// );

// router.put(
//   '/category-service/:id',
//   authMiddleware,
//   // [
//   //   body('value').optional().notEmpty().withMessage('Giá trị (value) không được để trống.'),
//   //   body('label').optional().notEmpty().withMessage('Tên danh mục (label) không được để trống.'),
//   //   body('isActive').optional().isBoolean().withMessage('Trạng thái (isActive) phải là boolean.'),
//   // ],
//   categoryServiceControllers.updateCategoryService
// );

// router.delete('/category-service/:id', authMiddleware, categoryServiceControllers.deleteCategoryService);

// Route quản lý danh mục dịch vụ
router.get('/category-service', categoryServiceControllers.getCategoryService);
router.post('/category-service', authMiddleware, categoryServiceControllers.createCategoryService);
router.put('/category-service/:id', authMiddleware, categoryServiceControllers.updateCategoryService);
router.delete('/category-service/:id', authMiddleware, categoryServiceControllers.deleteCategoryService);

module.exports = router;