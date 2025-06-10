/**
 * Helper functions for working with KML files
 */

/**
 * Normalizes coordinates from KML string
 * @param {string} coordinates - Raw coordinates string from KML file
 * @returns {Array|null} - Array of coordinate objects {lat, lng, alt} or null if invalid
 */
export const normalizeCoordinates = (coordinates) => {
  if (!coordinates) return null;
  
  // Sometimes coordinates have different formatting or extra spaces
  // This standardizes the format for consistent parsing
  
  // Remove all whitespace then split by space or comma
  const cleaned = coordinates.replace(/\s+/g, ' ').trim();
  const points = cleaned.split(' ');
  
  return points.map(point => {
    const [lng, lat, alt = 0] = point.split(',').map(parseFloat);
    // Check if we have valid coordinates (handle possible parsing errors)
    if (isNaN(lng) || isNaN(lat)) return null;
    
    // Ensure coordinates are within reasonable range for Mongolia
    // Mongolia longitude range: approximately 87.5 to 120
    // Mongolia latitude range: approximately 41.5 to 52.5
    if (lng < 87.5 || lng > 120 || lat < 41.5 || lat > 52.5) {
      console.warn(`Possibly invalid coordinate detected: ${lng},${lat}`);
    }
    
    return { lng, lat, alt };
  }).filter(Boolean); // Remove any null entries
};

/**
 * Sanitizes KML content to fix common issues
 * @param {string} kmlContent - Raw KML content
 * @returns {string} - Sanitized KML content
 */
export const sanitizeKmlContent = (kmlContent) => {
  if (!kmlContent) return '';
  
  let processed = kmlContent;
  
  // Fix 1: Remove xsi:schemaLocation attributes which can cause INVALID_REQUEST
  processed = processed.replace(/xsi:schemaLocation="[^"]*"/g, '');
  
  // Fix 2: Make sure the XML is properly formatted (no invalid characters)
  processed = processed.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
  
  // Fix 3: Make sure URLs in the KML file are set to HTTPS if they're HTTP
  processed = processed.replace(/http:\/\//g, 'https://');
  
  // Fix 4: Remove XML namespaces that might cause issues
  processed = processed.replace(/xmlns:xsi="[^"]*"/g, '');
  
  return processed;
};

/**
 * Parses KML content to DOM
 * @param {string} kmlString - KML content
 * @returns {Document|null} - Parsed XML document or null if parsing failed
 */
export const parseKML = (kmlString) => {
  try {
    // First sanitize the KML
    const sanitized = sanitizeKmlContent(kmlString);
    
    // Then parse it
    const parser = new DOMParser();
    return parser.parseFromString(sanitized, "text/xml");
  } catch (error) {
    console.error("Error parsing KML:", error);
    return null;
  }
};

/**
 * Helper function to process points in geometries (for Google Maps)
 * @param {google.maps.LatLng|google.maps.Data.Point|google.maps.MVCArray} geometry
 * @param {Function} callback - Function to call with each point
 * @param {Object} thisArg - Context to bind callback to
 */
export const processPoints = (geometry, callback, thisArg) => {
  if (geometry instanceof google.maps.LatLng) {
    callback.call(thisArg, geometry);
  } else if (geometry instanceof google.maps.Data.Point) {
    callback.call(thisArg, geometry.get());
  } else {
    geometry.getArray().forEach(g => {
      processPoints(g, callback, thisArg);
    });
  }
};
