const express = require('express');
const router = express.Router();
const khorooController = require('../controllers/khorooController');
const { Types } = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid khoroo ID format'
        });
    }
    next();
};

router.post('/', khorooController.createKhoroo);
router.get('/', khorooController.getAllKhoroos);
router.get('/district/:districtCode', khorooController.getKhoroosByDistrict);
router.get('/:id', validateObjectId, khorooController.getKhorooById);
router.put('/:id', validateObjectId, khorooController.updateKhoroo);
router.delete('/:id', validateObjectId, khorooController.deleteKhoroo);

module.exports = router;
