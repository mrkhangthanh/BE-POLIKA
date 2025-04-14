const express = require('express');
const router = express.Router();
const updateFcm = require('../updateFcmToken');
const authMiddleware = require('../../middlewares/auth');


router.put('/users/:id/fcm-token', authMiddleware, updateFcm.updateFcmToken);

module.exports = router;