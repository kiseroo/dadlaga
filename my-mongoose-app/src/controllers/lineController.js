const LineService = require('../services/lineService');
const MapDrawingUtils = require('../utils/mapDrawingUtils');

const createLine = async (req, res) => {
  try {
    const lineData = req.body;

    const coordinateValidation = MapDrawingUtils.validateCoordinatesArray(lineData.coordinates);
    if (!coordinateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: coordinateValidation.error
      });
    }

    const savedLine = await LineService.createLine(lineData);

    const stats = LineService.calculateLineStats(savedLine.coordinates);

    res.status(201).json({
      success: true,
      message: 'Line created successfully',
      data: {
        ...savedLine.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error('Error creating line:', error);
    
    if (error.message.includes('Validation failed') || error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating line',
      error: error.message
    });
  }
};

const getLines = async (req, res) => {
  try {
    const { sambarCode, startShonId, endShonId } = req.query;
    
    const filters = {};
    if (sambarCode) filters.sambarCode = sambarCode;
    if (startShonId) filters.startShonId = startShonId;
    if (endShonId) filters.endShonId = endShonId;

    const lines = await LineService.getLines(filters);

    const linesWithStats = lines.map(line => {
      const stats = LineService.calculateLineStats(line.coordinates);
      const distance = MapDrawingUtils.calculatePolylineDistance(line.coordinates);
      
      return {
        ...line.toObject(),
        stats: {
          ...stats,
          totalDistanceKm: distance
        }
      };
    });

    res.json({
      success: true,
      data: linesWithStats,
      total: linesWithStats.length
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

const getLineById = async (req, res) => {
  try {
    const { id } = req.params;

    const line = await LineService.getLineById(id);
    
    const stats = LineService.calculateLineStats(line.coordinates);
    const distance = MapDrawingUtils.calculatePolylineDistance(line.coordinates);
    const boundingBox = MapDrawingUtils.getBoundingBox(line.coordinates);

    res.json({
      success: true,
      data: {
        ...line.toObject(),
        stats: {
          ...stats,
          totalDistanceKm: distance
        },
        boundingBox
      }
    });
  } catch (error) {
    console.error('Error fetching line:', error);
    
    if (error.message === 'Line not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching line',
      error: error.message
    });
  }
};

const updateLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body;

    const coordinateValidation = MapDrawingUtils.validateCoordinatesArray(coordinates);
    if (!coordinateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: coordinateValidation.error
      });
    }

    const line = await LineService.updateLineCoordinates(id, coordinates);
    
    const stats = LineService.calculateLineStats(line.coordinates);
    const distance = MapDrawingUtils.calculatePolylineDistance(line.coordinates);

    res.json({
      success: true,
      message: 'Line updated successfully',
      data: {
        ...line.toObject(),
        stats: {
          ...stats,
          totalDistanceKm: distance
        }
      }
    });
  } catch (error) {
    console.error('Error updating line:', error);
    
    if (error.message === 'Line not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Invalid coordinate')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating line',
      error: error.message
    });
  }
};

const deleteLine = async (req, res) => {
  try {
    const { id } = req.params;

    await LineService.deleteLine(id);

    res.json({
      success: true,
      message: 'Line deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting line:', error);
    
    if (error.message === 'Line not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting line',
      error: error.message
    });
  }
};

const getLinesForShon = async (req, res) => {
  try {
    const { shonId } = req.params;

    const lines = await LineService.getLinesForShon(shonId);

    const linesWithStats = lines.map(line => {
      const stats = LineService.calculateLineStats(line.coordinates);
      const distance = MapDrawingUtils.calculatePolylineDistance(line.coordinates);
      
      return {
        ...line.toObject(),
        stats: {
          ...stats,
          totalDistanceKm: distance
        }
      };
    });

    res.json({
      success: true,
      data: linesWithStats,
      total: linesWithStats.length
    });
  } catch (error) {
    console.error('Error fetching lines for shon:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lines for shon',
      error: error.message
    });
  }
};

const simplifyLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { tolerance = 10 } = req.body; 

    const line = await LineService.getLineById(id);
    const simplifiedCoordinates = MapDrawingUtils.simplifyPolyline(line.coordinates, tolerance);
    
    const updatedLine = await LineService.updateLineCoordinates(id, simplifiedCoordinates);
    
    const stats = LineService.calculateLineStats(updatedLine.coordinates);
    const distance = MapDrawingUtils.calculatePolylineDistance(updatedLine.coordinates);

    res.json({
      success: true,
      message: 'Line simplified successfully',
      data: {
        ...updatedLine.toObject(),
        stats: {
          ...stats,
          totalDistanceKm: distance,
          pointsRemoved: line.coordinates.length - simplifiedCoordinates.length
        }
      }
    });
  } catch (error) {
    console.error('Error simplifying line:', error);
    
    if (error.message === 'Line not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error simplifying line',
      error: error.message
    });
  }
};

module.exports = {
  createLine,
  getLines,
  getLineById,
  updateLine,
  deleteLine,
  getLinesForShon,
  simplifyLine
};
