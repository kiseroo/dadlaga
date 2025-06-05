const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { Types } = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }
    next();
};

router.post('/login', userController.login);
router.post('/users', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/users/:id', validateObjectId, userController.getUserById);
router.put('/users/:id', validateObjectId, userController.updateUser);
router.delete('/users/:id', validateObjectId, userController.deleteUser);

module.exports = router;