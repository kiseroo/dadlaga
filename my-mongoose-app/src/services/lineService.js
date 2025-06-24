const Line = require('../models/Line');
const Shon = require('../models/Shon');

/**
 * Service layer for line operations
 * Contains business logic separated from controllers
 */
class LineService {
  
  /**
   * Validate line data before creation/update
   */
  static validateLineData(data) {
    const { sambarCode, startShonId, endShonId, coordinates } = data;
    const errors = [];

    if (!sambarCode) errors.push('sambarCode is required');
    if (!startShonId) errors.push('startShonId is required');
    if (!endShonId) errors.push('endShonId is required');
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      errors.push('coordinates must be a non-empty array');
    }

    // Validate coordinate structure
    if (coordinates && Array.isArray(coordinates)) {
      coordinates.forEach((coord, index) => {
        if (!coord.lat || !coord.lng || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
          errors.push(`Invalid coordinate at index ${index}: lat and lng must be numbers`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that shons exist before creating a line
   */
  static async validateShonsExist(startShonId, endShonId) {
    const [startShon, endShon] = await Promise.all([
      Shon.findById(startShonId),
      Shon.findById(endShonId)
    ]);

    return {
      startShonExists: !!startShon,
      endShonExists: !!endShon,
      startShon,
      endShon
    };
  }

  /**
   * Create a new line with validation
   */
  static async createLine(lineData) {
    // Validate input data
    const validation = this.validateLineData(lineData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const { sambarCode, startShonId, endShonId, coordinates } = lineData;

    // Validate shons exist
    const shonValidation = await this.validateShonsExist(startShonId, endShonId);
    if (!shonValidation.startShonExists || !shonValidation.endShonExists) {
      throw new Error('One or both shons do not exist');
    }

    // Check for duplicate lines
    const existingLine = await Line.findOne({
      sambarCode,
      $or: [
        { startShonId, endShonId },
        { startShonId: endShonId, endShonId: startShonId }
      ]
    });

    if (existingLine) {
      throw new Error('A line already exists between these shons');
    }

    // Create and save the line
    const line = new Line({
      sambarCode,
      startShonId,
      endShonId,
      coordinates
    });

    return await line.save();
  }

  /**
   * Get lines with optional filtering
   */
  static async getLines(filters = {}) {
    const { sambarCode, startShonId, endShonId } = filters;
    
    let query = {};
    if (sambarCode) query.sambarCode = sambarCode;
    if (startShonId) query.startShonId = startShonId;
    if (endShonId) query.endShonId = endShonId;

    return await Line.find(query)
      .populate('startShonId', 'code name location coordinates')
      .populate('endShonId', 'code name location coordinates')
      .sort({ createdAt: -1 });
  }

  /**
   * Get a specific line by ID
   */
  static async getLineById(lineId) {
    const line = await Line.findById(lineId)
      .populate('startShonId', 'code name location coordinates')
      .populate('endShonId', 'code name location coordinates');
    
    if (!line) {
      throw new Error('Line not found');
    }

    return line;
  }

  /**
   * Update line coordinates
   */
  static async updateLineCoordinates(lineId, coordinates) {
    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error('Valid coordinates array is required');
    }

    coordinates.forEach((coord, index) => {
      if (!coord.lat || !coord.lng || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
        throw new Error(`Invalid coordinate at index ${index}: lat and lng must be numbers`);
      }
    });

    const line = await Line.findByIdAndUpdate(
      lineId,
      { coordinates },
      { new: true, runValidators: true }
    );

    if (!line) {
      throw new Error('Line not found');
    }

    return line;
  }

  /**
   * Delete a line
   */
  static async deleteLine(lineId) {
    const line = await Line.findByIdAndDelete(lineId);
    
    if (!line) {
      throw new Error('Line not found');
    }

    return line;
  }

  /**
   * Get lines connecting to a specific shon
   */
  static async getLinesForShon(shonId) {
    return await Line.find({
      $or: [
        { startShonId: shonId },
        { endShonId: shonId }
      ]
    })
    .populate('startShonId', 'code name location coordinates')
    .populate('endShonId', 'code name location coordinates')
    .sort({ createdAt: -1 });
  }

  /**
   * Calculate line statistics
   */
  static calculateLineStats(coordinates) {
    if (!coordinates || coordinates.length < 2) {
      return {
        totalPoints: coordinates?.length || 0,
        inflectionPoints: 0,
        estimatedDistance: 0
      };
    }

    const inflectionPoints = coordinates.length - 2; // Exclude start and end points
    
    // Simple distance calculation (Haversine formula would be more accurate)
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const point1 = coordinates[i];
      const point2 = coordinates[i + 1];
      
      // Simple Euclidean distance (for approximation)
      const distance = Math.sqrt(
        Math.pow(point2.lat - point1.lat, 2) + 
        Math.pow(point2.lng - point1.lng, 2)
      );
      totalDistance += distance;
    }

    return {
      totalPoints: coordinates.length,
      inflectionPoints,
      estimatedDistance: totalDistance
    };
  }
}

module.exports = LineService;
