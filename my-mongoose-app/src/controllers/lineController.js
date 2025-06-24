const Line = require('../models/Line');
const Shon = require('../models/Shon');

// Create a new line
const createLine = async (req, res) => {
  try {
    const { sambarCode, startShonId, endShonId, coordinates } = req.body;

    // Validate required fields
    if (!sambarCode || !startShonId || !endShonId || !coordinates || coordinates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sambarCode, startShonId, endShonId, and coordinates are required'
      });
    }

    // Validate that both shons exist
    const startShon = await Shon.findById(startShonId);
    const endShon = await Shon.findById(endShonId);

    if (!startShon || !endShon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shon IDs provided'
      });
    }

    // Create the line
    const line = new Line({
      sambarCode,
      startShonId,
      endShonId,
      coordinates
    });

    const savedLine = await line.save();

    res.status(201).json({
      success: true,
      message: 'Line created successfully',
      data: savedLine
    });
  } catch (error) {
    console.error('Error creating line:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating line',
      error: error.message
    });
  }
};

// Get all lines or lines for a specific sambar
const getLines = async (req, res) => {
  try {
    const { sambarCode } = req.query;
    
    let filter = {};
    if (sambarCode) {
      filter.sambarCode = sambarCode;
    }

    const lines = await Line.find(filter)
      .populate('startShonId', 'code name location')
      .populate('endShonId', 'code name location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: lines
    });
  } catch (error) {
    console.error('Error fetching lines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lines',
      error: error.message
    });
  }
};

// Get a specific line by ID
const getLineById = async (req, res) => {
  try {
    const { id } = req.params;

    const line = await Line.findById(id)
      .populate('startShonId', 'code name location')
      .populate('endShonId', 'code name location');

    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Line not found'
      });
    }

    res.json({
      success: true,
      data: line
    });
  } catch (error) {
    console.error('Error fetching line:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching line',
      error: error.message
    });
  }
};

// Update a line
const updateLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are required'
      });
    }

    const line = await Line.findByIdAndUpdate(
      id,
      { coordinates },
      { new: true, runValidators: true }
    );

    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Line not found'
      });
    }

    res.json({
      success: true,
      message: 'Line updated successfully',
      data: line
    });
  } catch (error) {
    console.error('Error updating line:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating line',
      error: error.message
    });
  }
};

// Delete a line
const deleteLine = async (req, res) => {
  try {
    const { id } = req.params;

    const line = await Line.findByIdAndDelete(id);

    if (!line) {
      return res.status(404).json({
        success: false,
        message: 'Line not found'
      });
    }

    res.json({
      success: true,
      message: 'Line deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting line:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting line',
      error: error.message
    });
  }
};

module.exports = {
  createLine,
  getLines,
  getLineById,
  updateLine,
  deleteLine
};
