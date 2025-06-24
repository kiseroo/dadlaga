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
    const { district, khoroo } = req.query;
    
    const filter = {};
    
    if (district) {
        filter['khorooInfo.district'] = district;
    }
    
    if (khoroo) {
        filter['khorooInfo.khoroo'] = khoroo;
    }
    
    const shons = await Shon.find(filter).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        count: shons.length,
        data: shons
    });
};

const createShonController = async (req, res) => {
    try {
        console.log("Creating shon with data:", req.body);
        const { name, coordinates, khorooInfo } = req.body;
        
        if (!name || !coordinates || !coordinates.lat || !coordinates.lng) {
            console.log("Missing required fields:", { name, coordinates });
            return res.status(400).json({
                success: false,
                message: 'Name and coordinates are required'
            });
        }
        
        let district = khorooInfo?.district || 'unknown';
        let khoroo = khorooInfo?.khoroo || 'unknown';
        const uniqueCode = `SHON-${district}-${khoroo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        console.log("Creating new Shon model instance with code:", uniqueCode);
        const newShon = new Shon({
            name,
            code: uniqueCode,
            coordinates: {
                lat: Number(coordinates.lat),
                lng: Number(coordinates.lng)
            },
            khorooInfo
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
    
    res.json({
        success: true,
        data: shon
    });
};

const updateShonController = async (req, res) => {
    const { id } = req.params;
    const { name, coordinates, khorooInfo } = req.body;
    
    const shon = await Shon.findById(id);
    
    if (!shon) {
        return res.status(404).json({
            success: false,
            message: 'Shon not found'
        });
    }
    
    // Update fields
    if (name) shon.name = name;
    if (coordinates) {
        if (coordinates.lat) shon.coordinates.lat = coordinates.lat;
        if (coordinates.lng) shon.coordinates.lng = coordinates.lng;
    }
    if (khorooInfo) shon.khorooInfo = khorooInfo;
    
    await shon.save();
    
    res.json({
        success: true,
        message: 'Shon updated successfully',
        data: shon
    });
};

const deleteShonController = async (req, res) => {    const { id } = req.params;
    
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
