/**
 * Utility functions for map drawing and coordinate operations
 */
class MapDrawingUtils {
  
  /**
   * Validate coordinate format
   */
  static isValidCoordinate(coord) {
    return (
      coord &&
      typeof coord === 'object' &&
      typeof coord.lat === 'number' &&
      typeof coord.lng === 'number' &&
      coord.lat >= -90 &&
      coord.lat <= 90 &&
      coord.lng >= -180 &&
      coord.lng <= 180
    );
  }

  /**
   * Validate array of coordinates
   */
  static validateCoordinatesArray(coordinates) {
    if (!Array.isArray(coordinates)) {
      return { isValid: false, error: 'Coordinates must be an array' };
    }

    if (coordinates.length < 2) {
      return { isValid: false, error: 'At least 2 coordinates are required for a line' };
    }

    for (let i = 0; i < coordinates.length; i++) {
      if (!this.isValidCoordinate(coordinates[i])) {
        return { 
          isValid: false, 
          error: `Invalid coordinate at index ${i}. Expected {lat: number, lng: number}` 
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate total distance of a polyline
   */
  static calculatePolylineDistance(coordinates) {
    if (!coordinates || coordinates.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += this.calculateDistance(coordinates[i], coordinates[i + 1]);
    }

    return totalDistance;
  }

  /**
   * Simplify a polyline by removing points that are too close together
   * @param {Array} coordinates - Array of {lat, lng} objects
   * @param {number} tolerance - Minimum distance between points in meters
   */
  static simplifyPolyline(coordinates, tolerance = 10) {
    if (!coordinates || coordinates.length <= 2) {
      return coordinates;
    }

    const simplified = [coordinates[0]]; // Always keep the first point
    
    for (let i = 1; i < coordinates.length - 1; i++) {
      const prevPoint = simplified[simplified.length - 1];
      const currentPoint = coordinates[i];
      const distance = this.calculateDistance(prevPoint, currentPoint) * 1000; // Convert to meters
      
      if (distance >= tolerance) {
        simplified.push(currentPoint);
      }
    }
    
    simplified.push(coordinates[coordinates.length - 1]); // Always keep the last point
    return simplified;
  }

  /**
   * Get the center point (centroid) of a polyline
   */
  static getPolylineCenter(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    const total = coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: total.lat / coordinates.length,
      lng: total.lng / coordinates.length
    };
  }

  /**
   * Get bounding box for a set of coordinates
   */
  static getBoundingBox(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    let minLat = coordinates[0].lat;
    let maxLat = coordinates[0].lat;
    let minLng = coordinates[0].lng;
    let maxLng = coordinates[0].lng;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLng = Math.min(minLng, coord.lng);
      maxLng = Math.max(maxLng, coord.lng);
    });

    return {
      southwest: { lat: minLat, lng: minLng },
      northeast: { lat: maxLat, lng: maxLng },
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      }
    };
  }

  /**
   * Check if a point is within a certain radius of a polyline
   */
  static isPointNearPolyline(point, coordinates, radiusKm = 0.1) {
    if (!coordinates || coordinates.length < 2) {
      return false;
    }

    for (let i = 0; i < coordinates.length - 1; i++) {
      const distance = this.distanceToLineSegment(point, coordinates[i], coordinates[i + 1]);
      if (distance <= radiusKm) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate distance from a point to a line segment
   */
  static distanceToLineSegment(point, lineStart, lineEnd) {
    const A = this.calculateDistance(point, lineStart);
    const B = this.calculateDistance(point, lineEnd);
    const C = this.calculateDistance(lineStart, lineEnd);

    if (C === 0) return A; // Line segment is a point

    const s = (A + B + C) / 2;
    const area = Math.sqrt(s * (s - A) * (s - B) * (s - C));
    
    if (isNaN(area)) return Math.min(A, B);
    
    return (2 * area) / C;
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinate(coord, precision = 6) {
    if (!this.isValidCoordinate(coord)) {
      return 'Invalid coordinate';
    }

    return `${coord.lat.toFixed(precision)}, ${coord.lng.toFixed(precision)}`;
  }

  /**
   * Generate intermediate points between two coordinates
   */
  static generateIntermediatePoints(start, end, numPoints = 10) {
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      points.push({ lat, lng });
    }
    
    return points;
  }

  /**
   * Convert polyline to GeoJSON format
   */
  static toGeoJSON(coordinates, properties = {}) {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map(coord => [coord.lng, coord.lat])
      },
      properties
    };
  }

  /**
   * Parse GeoJSON LineString to coordinates array
   */
  static fromGeoJSON(geoJSON) {
    if (
      !geoJSON ||
      geoJSON.type !== 'Feature' ||
      !geoJSON.geometry ||
      geoJSON.geometry.type !== 'LineString'
    ) {
      throw new Error('Invalid GeoJSON LineString format');
    }

    return geoJSON.geometry.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }
}

module.exports = MapDrawingUtils;
