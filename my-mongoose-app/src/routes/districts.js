const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');
const { Types } = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid district ID format'
        });
    }
    next();
};

router.post('/', districtController.createDistrict);
router.get('/', districtController.getAllDistricts);
router.get('/:id', validateObjectId, districtController.getDistrictById);
router.put('/:id', validateObjectId, districtController.updateDistrict);
router.delete('/:id', validateObjectId, districtController.deleteDistrict);

module.exports = router;
