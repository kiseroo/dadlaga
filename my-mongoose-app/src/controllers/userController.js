const User = require('../models/User');

const asyncHandler = (controller, errorMessage) => async (req, res) => {
    try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};

const loginController = async (req, res) => {
    const email = req.body.email || req.body.username;
    const { password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });
    }
    
    const userData = user.toObject();
    delete userData.password;
    
    res.json({ 
        success: true,
        message: 'Login successful',
        user: userData
    });
};

const createUserController = async (req, res) => {
    const userName = req.body.email || req.body.username;
    
    const newUser = new User({
        email: userName,
        password: req.body.password
    });
    
    await newUser.save();
    
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        userId: newUser._id,
        user: userResponse
    });
};

const getAllUsersController = async (req, res) => {
    const users = await User.find({}).select('-password');
    
    res.json({
        success: true,
        count: users.length,
        data: users
    });
};

const getUserByIdController = async (req, res) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    res.json({
        success: true,
        data: user
    });
};

const updateUserController = async (req, res) => {
    const updateData = {
        email: req.body.email,
        password: req.body.password,
        updatedAt: new Date()
    };
    
    const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    res.json({
        success: true,
        message: 'User updated successfully',
        user: {
            id: user._id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
};

const deleteUserController = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
};

exports.login = asyncHandler(loginController, 'Error during login');
exports.createUser = asyncHandler(createUserController, 'Failed to create user');
exports.getAllUsers = asyncHandler(getAllUsersController, 'Failed to fetch users');
exports.getUserById = asyncHandler(getUserByIdController, 'Failed to fetch user');
exports.updateUser = asyncHandler(updateUserController, 'Failed to update user');
exports.deleteUser = asyncHandler(deleteUserController, 'Failed to delete user');