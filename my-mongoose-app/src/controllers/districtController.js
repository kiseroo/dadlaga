const District = require('../models/District');

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

const getAllDistrictsController = async (req, res) => {
    const districts = await District.find({}).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        count: districts.length,
        data: districts
    });
};

const createDistrictController = async (req, res) => {
    const { name, coordinates, khorooInfo } = req.body;
    
    if (!name || !coordinates || !coordinates.lat || !coordinates.lng) {
        return res.status(400).json({
            success: false,
            message: 'Name and coordinates are required'
        });
    }
    
    const newDistrict = new District({
        name,
        coordinates,
        khorooInfo
    });
    
    await newDistrict.save();
    
    res.status(201).json({
        success: true,
        message: 'District saved successfully',
        data: newDistrict
    });
};

const getDistrictByIdController = async (req, res) => {
    const district = await District.findById(req.params.id);
    
    if (!district) {
        return res.status(404).json({
            success: false,
            message: 'District not found'
        });
    }
    
    res.json({
        success: true,
        data: district
    });
};

const updateDistrictController = async (req, res) => {
    const { name, coordinates, khorooInfo } = req.body;
    
    const district = await District.findById(req.params.id);
    
    if (!district) {
        return res.status(404).json({
            success: false,
            message: 'District not found'
        });
    }
    
    if (name) district.name = name;
    if (coordinates) district.coordinates = coordinates;
    if (khorooInfo) district.khorooInfo = khorooInfo;
    
    district.updatedAt = Date.now();
    
    await district.save();
    
    res.json({
        success: true,
        message: 'District updated successfully',
        data: district
    });
};

const deleteDistrictController = async (req, res) => {
    const district = await District.findById(req.params.id);
    
    if (!district) {
        return res.status(404).json({
            success: false,
            message: 'District not found'
        });
    }
    
    await district.deleteOne();
    
    res.json({
        success: true,
        message: 'District deleted successfully'
    });
};

// Export the controllers with error handling
module.exports = {
    getAllDistricts: asyncHandler(getAllDistrictsController, 'Error getting all districts'),
    createDistrict: asyncHandler(createDistrictController, 'Error creating district'),
    getDistrictById: asyncHandler(getDistrictByIdController, 'Error getting district'),
    updateDistrict: asyncHandler(updateDistrictController, 'Error updating district'),
    deleteDistrict: asyncHandler(deleteDistrictController, 'Error deleting district')
};
