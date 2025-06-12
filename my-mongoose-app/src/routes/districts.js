const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');

// Get all districts
router.get('/', districtController.getAllDistricts);

// Get district code map (Cyrillic to Latin)
router.get('/map/codes', districtController.getDistrictCodeMap);

// Get khoroos for a specific district
router.get('/:districtCode/khoroos', districtController.getKhoroosByDistrict);

// Get all sambars in a specific khoroo
router.get('/:districtCode/khoroos/:khorooNumber/sambars', districtController.getSambarsByKhoroo);

// Get specific district info - Must be after other specific routes to avoid conflicts
router.get('/:code', districtController.getDistrictByCode);

module.exports = router;
