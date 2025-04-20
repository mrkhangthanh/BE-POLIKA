const express = require('express');
const router = express.Router();
const filterPublicOrdersByCityController = require('../filterPublicOrdersByCityController/filterPublicOrdersByCity');
const customerValidator = require('../../order/validators/customerValidator');
const handleValidationErrors = require('../../order/middlewares/validationError');



router.get(
    '/filter-by-city',
    customerValidator.getAllOrdersValidation,
    handleValidationErrors,
    filterPublicOrdersByCityController.filterPublicOrdersByCity
  );

module.exports = router;