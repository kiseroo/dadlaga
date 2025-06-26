const Shon = require('../models/Shon');

const asyncHandler = (controller, errorMessage) => async (req, res) => {
    try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        return res.status(500).json({
            success: false,
            message: `${errorMessage}: ${error.message}`,
            error: error.stack
        });
    }
};

const getAllShonsController = async (req, res) => {
    const { sambarCode } = req.query;
    
    const filter = {};
    
    if (sambarCode) {
        filter.sambarCode = sambarCode;
    }
    
    const shons = await Shon.find(filter).sort({ createdAt: -1 });
    
    // Get sambar info to include district and khoroo data
    const Sambar = require('../models/Sambar');
    
    // Add khoroo info from the related sambars
    const enhancedShons = await Promise.all(shons.map(async shon => {
        const shonObj = shon.toObject();
        
        // Find the associated sambar to get khoroo info
        if (shon.sambarCode) {
            try {
                const sambar = await Sambar.findOne({ name: shon.sambarCode });
                if (sambar && sambar.khorooInfo) {
                    // Add khoroo info from sambar
                    shonObj.khorooInfo = {
                        district: sambar.khorooInfo.district,
                        khoroo: sambar.khorooInfo.khoroo,
                        name: sambar.khorooInfo.name
                    };
                }
            } catch (err) {
                console.error(`Error finding sambar for shon ${shon.code}:`, err);
            }
        }
        
        return shonObj;
    }));
    
    res.json({
        success: true,
        count: enhancedShons.length,
        data: enhancedShons
    });
};

const createShonController = async (req, res) => {
    try {
        console.log("Creating shon with data:", req.body);
        const { sambarCode, code, location, color, shape } = req.body;
        
        if (!sambarCode || !code || !location || !location.lat || !location.lng) {
            console.log("Missing required fields:", { sambarCode, code, location });
            return res.status(400).json({
                success: false,
                message: 'SambarCode, code, and location are required'
            });
        }
        
        console.log("Creating new Shon model instance with code:", code);
        const newShon = new Shon({
            sambarCode,
            code,
            location: {
                lat: Number(location.lat),
                lng: Number(location.lng)
            },
            color: color || 'green',
            shape: shape || 'one-line'
        });
        
        console.log("Saving shon to database");
        const savedShon = await newShon.save();
        console.log("Shon saved successfully:", savedShon);
        
        res.status(201).json({
            success: true,
            message: 'Shon created successfully',
            data: savedShon
        });
    } catch (error) {
        console.error("Detailed error in createShonController:", error);
        throw error; 
    }
};

const getShonByIdController = async (req, res) => {
    const { id } = req.params;
    
    const shon = await Shon.findById(id);
    
    if (!shon) {
        return res.status(404).json({
            success: false,
            message: 'Shon not found'
        });
    }
    
    // Get the associated sambar to add khoroo info
    const shonObj = shon.toObject();
    
    if (shon.sambarCode) {
        const Sambar = require('../models/Sambar');
        try {
            const sambar = await Sambar.findOne({ name: shon.sambarCode });
            if (sambar && sambar.khorooInfo) {
                // Add khoroo info from sambar
                shonObj.khorooInfo = {
                    district: sambar.khorooInfo.district,
                    khoroo: sambar.khorooInfo.khoroo,
                    name: sambar.khorooInfo.name
                };
            }
        } catch (err) {
            console.error(`Error finding sambar for shon ${shon.code}:`, err);
        }
    }
    
    res.json({
        success: true,
        data: shonObj
    });
};

const updateShonController = async (req, res) => {
    const { id } = req.params;
    const { sambarCode, code, location, color, shape } = req.body;
    
    const shon = await Shon.findById(id);
    
    if (!shon) {
        return res.status(404).json({
            success: false,
            message: 'Shon not found'
        });
    }
    
    // Update fields
    if (sambarCode) shon.sambarCode = sambarCode;
    if (code) shon.code = code;
    if (location) {
        if (location.lat !== undefined) shon.location.lat = Number(location.lat);
        if (location.lng !== undefined) shon.location.lng = Number(location.lng);
    }
    if (color) shon.color = color;
    if (shape) shon.shape = shape;
    
    await shon.save();
    
    res.json({
        success: true,
        message: 'Shon updated successfully',
        data: shon
    });
};

const deleteShonController = async (req, res) => {
    const { id } = req.params;
    
    const shon = await Shon.findById(id);
    
    if (!shon) {
        return res.status(404).json({
            success: false,
            message: 'Shon not found'
        });
    }
    
    await Shon.deleteOne({ _id: id });
    
    res.json({
        success: true,
        message: 'Shon deleted successfully'
    });
};

module.exports = {
    getAllShons: asyncHandler(getAllShonsController, 'Error retrieving shons'),
    createShon: asyncHandler(createShonController, 'Error creating shon'),
    getShonById: asyncHandler(getShonByIdController, 'Error retrieving shon'),
    updateShon: asyncHandler(updateShonController, 'Error updating shon'),
    deleteShon: asyncHandler(deleteShonController, 'Error deleting shon')
};
