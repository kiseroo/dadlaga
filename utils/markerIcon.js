/**
 * @param {string} name - Name 
 * @param {number} size - Size 
 * @param {string} type - Type of marker ('sambar' or 'shon')
 * @param {boolean} isSelected - Whether the marker is selected
 * @returns {Object} Google Maps icon config
 */
export const createMarkerIcon = (name = '', size = 40, type = 'sambar', isSelected = false) => {
  const displayName = name.length > 12 ? name.substring(0, 10) + '..' : name;
  const encodedName = displayName.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  // Choose colors based on type
  const markerColor = type === 'sambar' ? '%23FFA500' : '%2332CD32'; // Orange or Green
  
  // Add a different stroke color and width if selected
  const strokeColor = isSelected ? '%23FF0000' : '%23000000'; // Red if selected, black otherwise
  const strokeWidth = isSelected ? 5 : 3; // Thicker stroke if selected
  
  const svgMarker = `data:image/svg+xml;utf8,<svg width="120" height="200" viewBox="0 0 512 650" xmlns="http://www.w3.org/2000/svg">
    <!-- White background rectangle with shadow effect for text -->
    <rect x="36" y="5" width="440" height="90" rx="10" fill="%23ffffff" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
    
    <!-- Name text at the top with better visibility -->
    <text x="256" y="70" font-family="Arial" font-size="70" font-weight="bold" fill="%23000000" text-anchor="middle">${encodedName}</text>
    
    <!-- Map marker shape - with type-based color and selection highlight -->
    <path transform="translate(0,120)" fill="${markerColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" d="M256 0C150 0 64 86 64 192c0 125.6 163.6 307.2 175.4 320.3 9.6 10.2 25.6 10.2 35.2 0C284.4 499.2 448 317.6 448 192 448 86 362 0 256 0z"/>
    
    <!-- Building shape with type indicator -->
    <rect transform="translate(0,120)" x="176" y="160" width="160" height="140" rx="16" fill="%23ffffff" stroke="%23000000" stroke-width="1"/>
    
    <!-- Windows with type-based color -->
    <rect transform="translate(0,120)" x="192" y="176" width="32" height="32" rx="4" fill="${markerColor}"/>
    <rect transform="translate(0,120)" x="240" y="176" width="32" height="32" rx="4" fill="${markerColor}"/>
    <rect transform="translate(0,120)" x="288" y="176" width="32" height="32" rx="4" fill="${markerColor}"/>
    
    <rect transform="translate(0,120)" x="192" y="224" width="32" height="32" rx="4" fill="${markerColor}"/>
    <rect transform="translate(0,120)" x="240" y="224" width="32" height="32" rx="4" fill="${markerColor}"/>
    <rect transform="translate(0,120)" x="288" y="224" width="32" height="32" rx="4" fill="${markerColor}"/>
  </svg>`;
  
  return {    
    url: svgMarker,
    scaledSize: new google.maps.Size(size * 1.5, size * 1.8), // Increase size for better text visibility
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(size * 0.75, size * 1.8) // Adjusted for perfect positioning at the tip
  };
};
