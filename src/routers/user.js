const express = require('express');
const router = express.Router();
const userController = require('../apps/Controllers/apis/userController');
const authMiddleware = require('../apps/middlewares/auth');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Quản lý user (admin và manager)
router.post(
    '/createUser',
    authMiddleware,
    requireRole(['admin'], { readOnly: false }),
    [
      body('email').isEmail().withMessage('Invalid email format'),
      body('password').notEmpty().withMessage('Password is required'),
      body('phone_number').matches(/^[0-9]{10,11}$/).withMessage('Phone number must be 10-11 digits'),
      body('role').isIn(['admin', 'manager', 'content_writer', 'technician', 'customer','agent']).withMessage('Invalid role'),
    ],
    userController.createUser 
  );
  
  router.get('/users', authMiddleware, requireRole(['admin', 'manager'], { readOnly: true }), userController.getAllUsers);
  router.get('/users/:id', authMiddleware, requireRole(['admin', 'manager'], { readOnly: true }), userController.getUserById);
  router.put('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }), userController.updateUser );
  router.delete('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }), userController.deleteUser );

  module.exports = router;