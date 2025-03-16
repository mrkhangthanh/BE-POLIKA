const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const userController = require('../apps/Controllers/apis/user');
const authMiddleware = require('../apps/middlewares/auth');
const  requireRole = require('../apps/middlewares/requireRole');
// API for Users
router.post('/users',authMiddleware, requireRole('admin') , userController.createUser);
router.get('/users',authMiddleware, requireRole('admin'), userController.getAllUsers);
router.get('/users/:id',authMiddleware, userController.getUserById);
router.delete('/users/:id',authMiddleware, requireRole('admin'), userController.deleteUser);

router.put('/users/:id',authMiddleware,
    [
      body('email').isEmail().withMessage('Invalid email format'),
      body('email').notEmpty().withMessage('Email is required'),
      body('role')
        .optional()
        .isIn(['admin', 'customer', 'technician', 'agent'])
        .withMessage('Invalid role'),
    ],
    userController.updateUser
  );


// API for login (không cần auth)               
router.post('/login', userController.loginUser);
router.post('/reset-password', userController.resetPassword); // Không yêu cầu auth để user có thể reset mật khẩu

module.exports = router;