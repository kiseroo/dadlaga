const Sambar = require('../models/Sambar');

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

const getAllSambarsController = async (req, res) => {
    const sambars = await Sambar.find({}).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        count: sambars.length,
        data: sambars
    });
};

const createSambarController = async (req, res) => {
    const { name, coordinates, khorooInfo } = req.body;
    
    if (!name || !coordinates || !coordinates.lat || !coordinates.lng) {
        return res.status(400).json({
            success: false,
            message: 'Name and coordinates are required'
        });
    }
    
    const newSambar = new Sambar({
        name,
        coordinates,
        khorooInfo
    });
    
    await newSambar.save();
    
    res.status(201).json({
        success: true,
        message: 'Location saved successfully',
        data: newSambar
    });
};

const getSambarByIdController = async (req, res) => {
    const sambar = await Sambar.findById(req.params.id);
    
    if (!sambar) {
        return res.status(404).json({
            success: false,
            message: 'Location not found'
        });
    }
    
    res.json({
        success: true,
        data: sambar
    });
};

const updateSambarController = async (req, res) => {
    const updateData = {
        ...req.body,
        updatedAt: new Date()
    };
    
    const sambar = await Sambar.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );
    
    if (!sambar) {
        return res.status(404).json({
            success: false,
            message: 'Location not found'
        });
    }
    
    res.json({
        success: true,
        message: 'Location updated successfully',
        data: sambar
    });
};

const deleteSambarController = async (req, res) => {
    const sambar = await Sambar.findByIdAndDelete(req.params.id);
    
    if (!sambar) {
        return res.status(404).json({
            success: false,
            message: 'Location not found'
        });
    }
    
    res.json({
        success: true,
        message: 'Location deleted successfully'
    });
};

exports.getAllSambars = asyncHandler(getAllSambarsController, 'Failed to fetch locations');
exports.createSambar = asyncHandler(createSambarController, 'Failed to create location');
exports.getSambarById = asyncHandler(getSambarByIdController, 'Failed to fetch location');
exports.updateSambar = asyncHandler(updateSambarController, 'Failed to update location');
exports.deleteSambar = asyncHandler(deleteSambarController, 'Failed to delete location');
