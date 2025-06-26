import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, KmlLayer, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import useDistrictKhoroo from '../hooks/useDistrictKhoroo';
import { createMarkerIcon } from '../utils/markerIcon';

// Helper function to generate shon marker SVG based on color and shape
const generateShonMarkerSVG = (name, color = 'green', shape = 'one-line') => {
  const colorMap = {
    'green': '#32CD32',
    'red': '#FF0000',
    'yellow': '#FFD700'
  };
  
  const pinColor = colorMap[color] || '#32CD32';
  
  // Generate lines based on shape - made shorter and use pin color
  let lines = '';
  if (shape === 'one-line') {
    lines = `<line x1="20" y1="22" x2="20" y2="30" stroke="${pinColor}" stroke-width="2"/>`;
  } else if (shape === 'two-lines') {
    lines = `
      <line x1="17" y1="22" x2="17" y2="30" stroke="${pinColor}" stroke-width="2"/>
      <line x1="23" y1="22" x2="23" y2="30" stroke="${pinColor}" stroke-width="2"/>
    `;
  } else if (shape === 'three-lines') {
    lines = `
      <line x1="17" y1="22" x2="17" y2="30" stroke="${pinColor}" stroke-width="1.5"/>
      <line x1="20" y1="22" x2="20" y2="30" stroke="${pinColor}" stroke-width="1.5"/>
      <line x1="23" y1="22" x2="23" y2="30" stroke="${pinColor}" stroke-width="1.5"/>
    `;
  }
  
  return `
    <svg width="40" height="42" viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
      <!-- White label background -->
      <rect x="1" y="1" width="38" height="16" fill="white" stroke="#ddd" stroke-width="1"/>
      <!-- Shon name text -->
      <text x="20" y="11" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#333">${(name || 'Shon').substring(0, 10)}</text>
      <!-- Pin shape -->
      <path d="M20 18C15.582 18 12 21.582 12 26c0 5.25 8 16 8 16s8-10.75 8-16c0-4.418-3.582-8-8-8z" fill="${pinColor}"/>
      <circle cx="20" cy="26" r="6" fill="white"/>
      ${lines}
    </svg>
  `;
};

const containerStyle = {
  width: '100%', 
  height: '500px', 
  position: 'relative',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 47.9184,
  lng: 106.9177
};

const MapEdit = ({ 
  initialLocation, 
  onLocationChange, 
  sambar, 
  onKhorooInfoChange, 
  locationType = 'sambar',
  allShons = [],
  activeShonId = null,
  lines = [],
  currentLine = null,
  isDrawingLine = false,
  selectedShons = [],
  onShonSelect = null,
  onLineClick = null,
  onSambarSelect = null, // New prop for sambar selection during line drawing
  selectedSambarId = null // New prop for tracking selected sambar
}) => {
  const [initialCenter] = useState(() => {
    if (initialLocation) {
      return {
        lat: parseFloat(initialLocation.lat) || defaultCenter.lat,
        lng: parseFloat(initialLocation.lng) || defaultCenter.lng
      };
    }
    return defaultCenter;
  });
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const kmlLayerRef = useRef(null);
  
  const [khorooNumber, setKhorooNumber] = useState(null);
  
  const districtKhoroo = useDistrictKhoroo({
    initialLocation: initialLocation,
    initialKhorooInfo: sambar?.khorooInfo,
    onLocationChange,
    onKhorooInfoChange
  });
  
  const {
    districtData,
    selectedDistrict,
    selectedKhoroo,
    khorooInfo,
    selectedLocation,
    kmlUrl,
    kmlVisible,
    kmlKey,
    handleDistrictChange,
    handleKhorooChange,
    generateKhorooOptions
  } = districtKhoroo;
  
  useEffect(() => {
    if (selectedKhoroo) {
      setKhorooNumber(selectedKhoroo);
    }
  }, [selectedKhoroo]);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4",
    libraries: ['geometry']
  });
  const handleMapClick = useCallback((event) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Priority 1: If we're in line drawing mode, add inflection point
      if (isDrawingLine && onLineClick && typeof onLineClick === 'function') {
        console.log("Adding inflection point at:", { lat, lng });
        onLineClick({ lat, lng });
        return; // Stop here - don't handle any other clicks
      }
      
      // Priority 2: Handle normal location changes (only if NOT drawing line)
      if (!isDrawingLine && onLocationChange && typeof onLocationChange === 'function') {
        onLocationChange({ lat, lng });
      }
    }
  }, [onLocationChange, isDrawingLine, onLineClick]);
  
  const handleKmlClick = useCallback((event) => {
    // Don't handle KML clicks during line drawing mode
    if (isDrawingLine) {
      console.log("KML click ignored - in line drawing mode");
      return;
    }
    
    if (event && event.featureData) {
      console.log("KML feature clicked:", event.featureData);
      
      districtKhoroo.handleKmlClick(event);
      
      if (event.latLng) {
        console.log("New marker position set from KML click");
      }
    }
  }, [districtKhoroo, isDrawingLine]);
  const handleMapLoad = useCallback(map => {
    mapRef.current = map;
    console.log("Map loaded");
    
    if (selectedLocation) {
      map.panTo({
        lat: parseFloat(selectedLocation.lat),
        lng: parseFloat(selectedLocation.lng)
      });
    }
  }, [selectedLocation]);

  const handleMarkerDragEnd = useCallback((event) => {
    if (event && event.latLng && !isDrawingLine) { // Don't handle marker drag during line drawing
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      console.log("Marker dragged to:", { lat, lng });
      
      onLocationChange({ lat, lng });
    }
  }, [onLocationChange, isDrawingLine]);

  useEffect(() => {
    if (mapRef.current && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPoints = false;
      
      // For shon mode, only include shons in bounds, not the initial sambar location
      if (locationType === 'shon' && allShons && allShons.length > 0) {
        allShons.forEach(shon => {
          const shonLocation = shon.location || shon.coordinates;
          
          if (shonLocation && shonLocation.lat && shonLocation.lng) {
            bounds.extend({
              lat: parseFloat(shonLocation.lat),
              lng: parseFloat(shonLocation.lng)
            });
            hasValidPoints = true;
          }
        });
      } else {
        // For other modes (sambar), include initial location
        if (initialLocation) {
          bounds.extend({
            lat: parseFloat(initialLocation.lat),
            lng: parseFloat(initialLocation.lng)
          });
          hasValidPoints = true;
        }
        
        // Also include shons if available
        if (allShons && allShons.length > 0) {
          allShons.forEach(shon => {
            const shonLocation = shon.location || shon.coordinates;
            
            if (shonLocation && shonLocation.lat && shonLocation.lng) {
              bounds.extend({
                lat: parseFloat(shonLocation.lat),
                lng: parseFloat(shonLocation.lng)
              });
              hasValidPoints = true;
            }
          });
        }
      }
      
      if (hasValidPoints) {
        mapRef.current.fitBounds(bounds);
        
        // If only one point or in shon mode with limited points, set appropriate zoom
        if ((locationType === 'shon' && allShons && allShons.length === 1) || 
            (locationType !== 'shon' && allShons && allShons.length === 0 && initialLocation)) {
          const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
            mapRef.current.setZoom(Math.min(15, mapRef.current.getZoom()));
          });
          return () => {
            window.google.maps.event.removeListener(listener);
          };
        }
      } else if (initialLocation) {
        // Fallback to initial location if no valid points
        mapRef.current.setCenter({
          lat: parseFloat(initialLocation.lat),
          lng: parseFloat(initialLocation.lng)
        });
        mapRef.current.setZoom(15);
      }
    }
  }, [mapRef, allShons, initialLocation, isLoaded, locationType]);

  if (!isLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Maps...</div>;
  }
  
  // Helper to determine if we should render the current sambar or not
  const shouldShowCurrentSambar = () => {
    // Always show current sambar when:
    // 1. Not in drawing mode, or
    // 2. In drawing mode (always show sambars during line drawing)
    return sambar && (
      !isDrawingLine || 
      isDrawingLine
    );
  };
  
  return (
    <div className="map-edit-container" style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter} 
        zoom={15}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          disableDefaultUI: false,
          clickableIcons: false // Prevent interference from map icons
        }}
      >
        {/* Always show current sambar marker in line drawing mode to allow connecting to it */}
        {shouldShowCurrentSambar() && (
          <Marker
            key={`sambar-${sambar._id || 'current'}`}
            position={{
              lat: parseFloat(sambar.coordinates?.lat || initialLocation?.lat),
              lng: parseFloat(sambar.coordinates?.lng || initialLocation?.lng)
            }}            
            title={sambar?.name || "Sambar"}
            icon={createMarkerIcon(sambar?.name || "Sambar", 50, 'sambar', selectedSambarId === sambar._id)} 
            zIndex={1000}
            onClick={() => {
              if (isDrawingLine && onSambarSelect && typeof onSambarSelect === 'function') {
                console.log("Sambar marker clicked for line selection:", sambar);
                onSambarSelect(sambar._id);
              } else if (onLocationChange && typeof onLocationChange === 'function') {
                console.log("Sambar marker clicked:", sambar);
                // Set location to sambar position when clicked (similar to shon click behavior)
                onLocationChange({
                  lat: parseFloat(sambar.coordinates?.lat || initialLocation?.lat),
                  lng: parseFloat(sambar.coordinates?.lng || initialLocation?.lng)
                });
              }
            }}
          />
        )}
        
        {/* Active marker - only show when editing specific shon or when not in shon mode, and NOT drawing a line */}
        {selectedLocation && (locationType !== 'shon' || activeShonId) && !isDrawingLine && (
          <Marker
            position={{
              lat: parseFloat(selectedLocation.lat),
              lng: parseFloat(selectedLocation.lng)
            }}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            icon={createMarkerIcon(sambar?.name || 'New', 50, locationType)}
            zIndex={1000} 
          />
        )}
        
        {/* Display all other shons */}
        {allShons && allShons.length > 0 && allShons.map(shon => {
          // Handle both 'location' (from backend) and 'coordinates' (legacy) fields
          const shonLocation = shon.location || shon.coordinates;
          
          if (!shonLocation || !shonLocation.lat || !shonLocation.lng) {
            console.warn('Shon missing location data:', shon);
            return null;
          }
          
          return (
            <Marker
              key={`shon-${shon._id}`}
              position={{
                lat: parseFloat(shonLocation.lat),
                lng: parseFloat(shonLocation.lng)
              }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                  generateShonMarkerSVG(shon.code || shon.name, shon.color, shon.shape)
                ),
                scaledSize: new google.maps.Size(40, 42),
                anchor: new google.maps.Point(20, 42)
              }}
              opacity={activeShonId === shon._id ? 0.5 : 1} 
              zIndex={activeShonId === shon._id ? 999 : (selectedShons.includes(shon._id) ? 800 : 500)} 
              onClick={() => {
                if (onShonSelect && typeof onShonSelect === 'function') {
                  console.log("Shon marker clicked for selection:", shon);
                  onShonSelect(shon._id);
                } else if (onLocationChange && typeof onLocationChange === 'function') {
                  console.log("Shon marker clicked:", shon);
                }
              }}
            />
          );
        })}
        
        {/* Highlight selected shons for line drawing */}
        {selectedShons.map(shonId => {
          const shon = allShons.find(s => s._id === shonId);
          if (!shon) return null;
          
          const shonLocation = shon.coordinates || shon.location;
          if (!shonLocation || !shonLocation.lat || !shonLocation.lng) return null;
          
          return (
            <Marker
              key={`selected-${shon._id}`}
              position={{
                lat: parseFloat(shonLocation.lat),
                lng: parseFloat(shonLocation.lng)
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#007bff',
                fillOpacity: 0.3,
                strokeColor: '#007bff',
                strokeWeight: 3,
                scale: 20
              }}
              zIndex={600}
            />
          );
        })}

        {/* Show red circles for current line inflection points during drawing */}
        {isDrawingLine && currentLine && currentLine.coordinates && currentLine.coordinates.map((point, index) => (
          <Marker
            key={`inflection-${index}`}
            position={{
              lat: parseFloat(point.lat),
              lng: parseFloat(point.lng)
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF0000',
              fillOpacity: 0.8,
              strokeColor: '#CC0000',
              strokeWeight: 2,
              scale: 8
            }}
            zIndex={900}
            title={`Inflection Point ${index + 1}`}
          />
        ))}

        {/* Show current line being drawn with preview to end point */}
        {isDrawingLine && currentLine && currentLine.coordinates && currentLine.coordinates.length > 0 && (
          (() => {
            // Find the endpoint - could be either a shon or a sambar
            let endCoords = null;
            
            if (currentLine.endSambarId && sambar && sambar._id === currentLine.endSambarId) {
              // End point is the current sambar (check for this first)
              endCoords = sambar.coordinates || initialLocation;
            } else if (currentLine.endShonId) {
              // End point is a shon
              const endShon = allShons.find(s => s._id === currentLine.endShonId);
              if (!endShon) return null;
              endCoords = endShon.coordinates || endShon.location;
            }
            
            if (!endCoords) return null;
            
            const completeLineCoords = [
              ...currentLine.coordinates,
              { lat: endCoords.lat, lng: endCoords.lng }
            ];
            
            return (
              <Polyline
                path={completeLineCoords.map(coord => ({
                  lat: parseFloat(coord.lat),
                  lng: parseFloat(coord.lng)
                }))}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  clickable: false
                }}
              />
            );
          })()
        )}

        {/* Show saved lines */}
        {lines && lines.length > 0 && lines.map((line, index) => {
          if (!line.coordinates || line.coordinates.length === 0) return null;
          
          return (
            <Polyline
              key={`saved-line-${line._id || index}`}
              path={line.coordinates.map(coord => ({
                lat: parseFloat(coord.lat),
                lng: parseFloat(coord.lng)
              }))}
              options={{
                strokeColor: '#CC0000',
                strokeOpacity: 0.9,
                strokeWeight: 4,
                clickable: true
              }}
              onClick={() => {
                // Show info about the line when clicked
                let startInfo = "Unknown";
                let endInfo = "Unknown";
                
                // Check for shon endpoints
                const startShon = allShons.find(s => s._id === line.startShonId);
                const endShon = allShons.find(s => s._id === line.endShonId);
                
                // Check for sambar endpoints
                if (line.startSambarId && sambar && sambar._id === line.startSambarId) {
                  startInfo = `Sambar: ${sambar.name || 'Current Sambar'}`;
                } else if (startShon) {
                  startInfo = `Shon: ${startShon.code || startShon.name || 'Unknown'}`;
                }
                
                if (line.endSambarId && sambar && sambar._id === line.endSambarId) {
                  endInfo = `Sambar: ${sambar.name || 'Current Sambar'}`;
                } else if (endShon) {
                  endInfo = `Shon: ${endShon.code || endShon.name || 'Unknown'}`;
                }
                
                alert(`Line: ${startInfo} → ${endInfo}\nPoints: ${line.coordinates.length}`);
              }}
            />
          );
        })}

        {/* Show red circles for saved line inflection points */}
        {lines && lines.length > 0 && lines.map((line, lineIndex) => 
          line.coordinates && line.coordinates.map((point, pointIndex) => (
            <Marker
              key={`saved-point-${line._id || lineIndex}-${pointIndex}`}
              position={{
                lat: parseFloat(point.lat),
                lng: parseFloat(point.lng)
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#990000',
                fillOpacity: 0.6,
                strokeColor: '#660000',
                strokeWeight: 1,
                scale: 4
              }}
              zIndex={700}
              title={`Line Point ${pointIndex + 1}`}
            />
          ))
        )}

        {/* KML Layer */}
        {kmlUrl && kmlVisible && (
          <KmlLayer
            key={`kml-layer-${kmlKey}`} 
            url={kmlUrl}
            options={{
              preserveViewport: true, 
              suppressInfoWindows: true,
              clickable: !isDrawingLine // Disable KML clicks during line drawing
            }}
            onLoad={(kmlLayer) => {
              console.log("KML Layer loaded successfully:", kmlUrl);
              kmlLayerRef.current = kmlLayer;
              if (kmlLayer) {
                google.maps.event.clearListeners(kmlLayer, 'click');
                // Only add click handler if not in line drawing mode
                if (!isDrawingLine) {
                  google.maps.event.addListener(kmlLayer, 'click', handleKmlClick);
                  console.log("KML click handler attached");
                }
              }
            }}
            onError={(error) => {
              console.error("KML Layer error:", error);
            }}
          />
        )}
        
        {/* District & Khoroo Overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          width: '250px',
          zIndex: 10
        }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '16px' }}>Дүүрэг & Хороо</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Дүүрэг сонгох:
            </label>            
            <select 
              id="mapEditDistrictSelect"
              value={selectedDistrict} 
              onChange={handleDistrictChange}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="">-- Дүүрэг сонгох --</option>
              {Object.entries(districtData).map(([code, data]) => (
                <option key={code} value={code}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedDistrict && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                Хороо сонгох:
              </label>              
              <select 
                id="mapEditKhorooSelect"
                value={selectedKhoroo} 
                onChange={handleKhorooChange}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Хороо сонгох --</option>
                {generateKhorooOptions().map(number => (
                  <option key={number} value={number}>
                    {number}-р хороо
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {kmlUrl && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <p style={{ margin: '0' }}>
                <strong>Current:</strong> {selectedDistrict} {selectedKhoroo ? `- ${selectedKhoroo} хороо` : ''}
              </p>
            </div>
          )}

          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
            Click on the blue khoroo area to place marker
          </p>
        </div>
      </GoogleMap>
      
      {/* Location Info */}
      {selectedLocation && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0' }}>
            <strong>Position:</strong> Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
      
      {/* Display khoroo info */}
      {sambar && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#e1f5fe',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0' }}>
            <strong>Location:</strong> {sambar.name || 'Unknown Area'}
          </p>
          
          {khorooNumber && (
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#333' }}>
              <strong>Khoroo Number:</strong> {khorooNumber}
            </p>
          )}
          
          {khorooInfo && (
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
              <strong>Current District:</strong> {khorooInfo.district || 'Unknown'}, 
              <strong>Khoroo:</strong> {khorooInfo.khoroo || 'Not set'}
            </p>
          )}
        </div>
      )}
      
      {/* Line Drawing Mode Indicator */}
      {isDrawingLine && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px',
          border: '1px solid #ff9999'
        }}>
          <p style={{ margin: '0', fontWeight: 'bold' }}>
            <i className="fa fa-pencil" style={{ marginRight: '5px' }}></i>
            Line Drawing Mode
          </p>
          <p style={{ margin: '5px 0 0', fontSize: '12px' }}>
            Click on the map to add points. Click on Shons or Sambars to connect to them.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(MapEdit);
