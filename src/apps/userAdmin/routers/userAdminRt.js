const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { getAdmins } = require('../userAdminController/userController');
const { createSupportConversation } = require('../userAdminController/supportController');
const requireRole = require('../../middlewares/requireRole');

router.post('/SupportId',
    authMiddleware,
    requireRole(['technician','customer','manager','admin']),
    createSupportConversation);

router.get('/users-Support', 
    authMiddleware,
    requireRole(['technician','customer','manager','admin']),
    getAdmins);

module.exports = router;
