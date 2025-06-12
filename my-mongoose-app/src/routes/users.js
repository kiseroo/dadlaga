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
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', validateObjectId, userController.getUserById);
router.put('/:id', validateObjectId, userController.updateUser);
router.delete('/users/:id', validateObjectId, userController.deleteUser);

module.exports = router;