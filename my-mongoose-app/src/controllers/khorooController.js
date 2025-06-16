const Khoroo = require('../models/Khoroo');

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

const getAllKhoroosController = async (req, res) => {
    const khoroos = await Khoroo.find({}).sort({ createdAt: -1 });
    
    res.json({
        success: true,
        count: khoroos.length,
        data: khoroos
    });
};

const getKhoroosByDistrictController = async (req, res) => {
    const { districtCode } = req.params;
    
    // Get khoroos and then sort them numerically by converting the number to integer
    const khoroos = await Khoroo.find({ districtCode });
    
    // Sort khoroos numerically instead of alphabetically
    khoroos.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    res.json({
        success: true,
        count: khoroos.length,
        data: khoroos
    });
};

const createKhorooController = async (req, res) => {
    const { number, name, districtCode, coordinates, boundaries, info } = req.body;
    
    if (!number || !name || !districtCode) {
        return res.status(400).json({
            success: false,
            message: 'Number, name and district code are required'
        });
    }
    
    const newKhoroo = new Khoroo({
        number,
        name,
        districtCode,
        coordinates,
        boundaries,
        info
    });
    
    await newKhoroo.save();
    
    res.status(201).json({
        success: true,
        message: 'Khoroo saved successfully',
        data: newKhoroo
    });
};

const getKhorooByIdController = async (req, res) => {
    const khoroo = await Khoroo.findById(req.params.id);
    
    if (!khoroo) {
        return res.status(404).json({
            success: false,
            message: 'Khoroo not found'
        });
    }
    
    res.json({
        success: true,
        data: khoroo
    });
};

const updateKhorooController = async (req, res) => {
    const { number, name, districtCode, coordinates, boundaries, info } = req.body;
    
    const khoroo = await Khoroo.findById(req.params.id);
    
    if (!khoroo) {
        return res.status(404).json({
            success: false,
            message: 'Khoroo not found'
        });
    }
    
    if (number) khoroo.number = number;
    if (name) khoroo.name = name;
    if (districtCode) khoroo.districtCode = districtCode;
    if (coordinates) khoroo.coordinates = coordinates;
    if (boundaries) khoroo.boundaries = boundaries;
    if (info) khoroo.info = info;
    
    khoroo.updatedAt = Date.now();
    
    await khoroo.save();
    
    res.json({
        success: true,
        message: 'Khoroo updated successfully',
        data: khoroo
    });
};

const deleteKhorooController = async (req, res) => {
    const khoroo = await Khoroo.findById(req.params.id);
    
    if (!khoroo) {
        return res.status(404).json({
            success: false,
            message: 'Khoroo not found'
        });
    }
    
    await khoroo.deleteOne();
    
    res.json({
        success: true,
        message: 'Khoroo deleted successfully'
    });
};

// Export the controllers with error handling
module.exports = {
    getAllKhoroos: asyncHandler(getAllKhoroosController, 'Error getting all khoroos'),
    getKhoroosByDistrict: asyncHandler(getKhoroosByDistrictController, 'Error getting khoroos by district'),
    createKhoroo: asyncHandler(createKhorooController, 'Error creating khoroo'),
    getKhorooById: asyncHandler(getKhorooByIdController, 'Error getting khoroo'),
    updateKhoroo: asyncHandler(updateKhorooController, 'Error updating khoroo'),
    deleteKhoroo: asyncHandler(deleteKhorooController, 'Error deleting khoroo')
};
