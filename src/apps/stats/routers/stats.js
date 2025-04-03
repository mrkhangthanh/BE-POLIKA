const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
// const handleValidationErrors = require('../../middlewares/validationError');
const authMiddleware = require('../../middlewares/auth');
// const userValidator = require('../validators/userValidator');
const requireRole = require('../../middlewares/requireRole');
const { body, validationResult } = require('express-validator');


router.get('/stats', authMiddleware, requireRole(['admin']), statsController.getStats);

module.exports = router;