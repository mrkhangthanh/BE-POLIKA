const express = require('express');
const router = express.Router();
const userController = require('../apps/Controllers/apis/userController');
const handleValidationErrors = require('../apps/middlewares/validationError');
const authMiddleware = require('../apps/middlewares/auth');
const userValidator = require('../validators/userValidator');
const requireRole = require('../apps/middlewares/requireRole');
const { body, validationResult } = require('express-validator');

// Quản lý user (admin và manager)
    router.post('/createUser',authMiddleware,requireRole(['admin'], { readOnly: false }),userValidator.createUserValidation,userController.createUser );
  router.get('/users', authMiddleware, requireRole(['admin', 'manager'], { readOnly: true }), userController.getAllUsers);
  router.get('/users/:id', authMiddleware, requireRole(['admin', 'manager'], { readOnly: true }), userController.getUserById);
  router.put('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }),userValidator.updateUserValidation, userController.updateUser );
  router.delete('/users/:id', authMiddleware, requireRole(['admin'], { readOnly: false }), userValidator.deleteUserValidation, handleValidationErrors,userController.deleteUser );

  module.exports = router;