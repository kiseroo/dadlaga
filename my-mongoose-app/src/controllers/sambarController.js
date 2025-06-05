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

const saveLocationController = async (req, res) => {
    const { name, coordinates } = req.body;
    
    if (!name || !coordinates || !coordinates.lat || !coordinates.lng) {
        return res.status(400).json({
            success: false,
            message: 'Name and coordinates are needed'
        });
    }
    
    const newLocation = new Sambar({
        name,
        coordinates
    });
    
    await newLocation.save();
    
    res.status(201).json({
        success: true,
        message: 'Location saved successfully',
        location: newLocation
    });
};

const getAllLocationsController = async (req, res) => {
    const locations = await Sambar.find({}).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        count: locations.length,
        data: locations
    });
};

exports.saveLocation = asyncHandler(saveLocationController, 'Failed to save location');
exports.getAllLocations = asyncHandler(getAllLocationsController, 'Failed to fetch locations');
