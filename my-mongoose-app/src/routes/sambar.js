const express = require('express');
const router = express.Router();
const sambarController = require('../controllers/sambarController');
const { Types } = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid location ID format'
        });
    }
    next();
};

router.post('/sambar', sambarController.createSambar);
router.get('/sambar', sambarController.getAllSambars);
router.get('/sambar/:id', validateObjectId, sambarController.getSambarById);
router.put('/sambar/:id', validateObjectId, sambarController.updateSambar);
router.delete('/sambar/:id', validateObjectId, sambarController.deleteSambar);

module.exports = router;