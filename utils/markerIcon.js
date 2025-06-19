/**
 * Creates a Google Maps marker icon using custom SVG with larger name text
 * @param {string} name - Name to display on the marker
 * @param {number} size - Size of the marker in pixels
 * @returns {Object} Google Maps icon configuration
 */
export const createMarkerIcon = (name = '', size = 40) => {
  // Prepare name for SVG (limit length and encode special characters)
  const displayName = name.length > 12 ? name.substring(0, 10) + '..' : name;
  const encodedName = displayName.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  // SVG marker with larger name text at the top of building
  const svgMarker = `data:image/svg+xml;utf8,<svg width="100" height="120" viewBox="0 0 512 550" xmlns="http://www.w3.org/2000/svg">
    <!-- Map marker shape -->
    <path fill="%23FFA500" d="M256 0C150 0 64 86 64 192c0 125.6 163.6 307.2 175.4 320.3 9.6 10.2 25.6 10.2 35.2 0C284.4 499.2 448 317.6 448 192 448 86 362 0 256 0z"/>
    
    <!-- Building shape -->
    <rect x="176" y="160" width="160" height="192" rx="16" fill="%23ffffff"/>
    
    <!-- Windows -->
    <rect x="192" y="176" width="32" height="32" rx="4" fill="%23FFA500"/>
    <rect x="240" y="176" width="32" height="32" rx="4" fill="%23FFA500"/>
    <rect x="288" y="176" width="32" height="32" rx="4" fill="%23FFA500"/>
    
    <rect x="192" y="224" width="32" height="32" rx="4" fill="%23FFA500"/>
    <rect x="240" y="224" width="32" height="32" rx="4" fill="%23FFA500"/>
    <rect x="288" y="224" width="32" height="32" rx="4" fill="%23FFA500"/>
    
    <!-- Name text with text shadow for better visibility -->
    <text x="256" y="120" font-family="Arial" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">${encodedName}</text>
  </svg>`;

  return {
    url: svgMarker,
    scaledSize: new google.maps.Size(size, size * 1.2), // Make height slightly taller to accommodate text
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(size/2, size) // Keep anchor at bottom center
  };
};
