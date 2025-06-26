import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, KmlLayer, InfoWindow, Polyline } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import useDistrictKhoroo from '../hooks/useDistrictKhoroo';
import { createMarkerIcon, createAdvancedMarker } from '../utils/markerIcon';

const containerStyle = {
  width: '100%', 
  height: '80vh', 
  position: 'relative'
};

const center = {
  lat: 47.9184,
  lng: 106.9177
};

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

function Map() {
  const [locationName, setLocationName] = useState('');
  const [saveStatus, setSaveStatus] = useState({ message: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");  
  const [sambarLocations, setSambarLocations] = useState([]);
  const [shonLocations, setShonLocations] = useState([]);
  const [locationType, setLocationType] = useState('sambar'); // Only allow sambar creation on main map
  
  // Add filter states
  const [showSambars, setShowSambars] = useState(true);
  const [showShons, setShowShons] = useState(false); // Initially hide shons
  const [showLines, setShowLines] = useState(false); // Initially hide lines
  const [selectedSambarId, setSelectedSambarId] = useState(null); // Track selected sambar
  
  // Line state
  const [allLines, setAllLines] = useState([]);
  
  const mapRef = useRef(null);
  const kmlLayerRef = useRef(null);
  const markerClustererRef = useRef(null);
  const markersRef = useRef([]);
  
  const {
    districtData,
    selectedDistrict,
    selectedKhoroo,
    khorooInfo,
    selectedLocation,
    kmlUrl,
    kmlLoading,
    handleDistrictChange,
    handleKhorooChange,
    handleKmlClick,
    generateKhorooOptions,
    prepareSavedKhorooInfo
  } = useDistrictKhoroo();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4",
    libraries: ['geometry']
  });  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const sambarResponse = await fetch(`http://localhost:3001/api/sambar`);
        const sambarData = await sambarResponse.json();
        
        if (sambarData.success) {
          setSambarLocations(sambarData.data || []);
        }

        const shonResponse = await fetch(`http://localhost:3001/api/shon`);
        const shonData = await shonResponse.json();
        
        if (shonData.success) {
          // Transform shon data to ensure coordinates field exists for compatibility
          const transformedShons = (shonData.data || []).map(shon => ({
            ...shon,
            // Ensure coordinates field exists for compatibility with map rendering
            coordinates: shon.location ? {
              lat: shon.location.lat,
              lng: shon.location.lng
            } : (shon.coordinates || { lat: 0, lng: 0 }),
            // Also ensure name field exists (shons use 'code' field)
            name: shon.code || shon.name || 'Unnamed Shon',
            // Ensure color and shape have default values
            color: shon.color || 'green',
            shape: shon.shape || 'one-line'
          }));
          setShonLocations(transformedShons);
        }

        // Fetch all lines
        try {
          const linesResponse = await fetch(`http://localhost:3001/api/lines`);
          const linesData = await linesResponse.json();
          
          if (linesData.success) {
            setAllLines(linesData.data || []);
          }
        } catch (lineError) {
          console.error('Error fetching lines:', lineError);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    
    fetchLocations();
  }, []);
  // marker clustering  
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
    useEffect(() => {
    if (!mapRef.current || !isLoaded || (sambarLocations.length === 0 && shonLocations.length === 0)) return;

    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }
    
    markersRef.current.forEach(marker => {
      if (marker.infoWindow) {
        marker.infoWindow.close();
      }
      marker.setMap(null);
    });
    markersRef.current = [];

    // store info windows
    const infoWindows = [];
      const sambarMarkers = showSambars ? sambarLocations
      .filter(location => 
        location && 
        location.coordinates && 
        location.coordinates.lat && 
        location.coordinates.lng &&
        // If a sambar is selected, only show that one, otherwise show all
        (!selectedSambarId || location._id === selectedSambarId)
      )
      .map((location) => {
      const marker = new google.maps.Marker({
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        icon: createMarkerIcon(location.name || 'Unnamed', 40, 'sambar', selectedSambarId === location._id),
        title: location.name,
        map: null
      });
      
      const contentString = `
        <div class="sambar-marker">
          <div class="marker-content">
            <div class="marker-header" style="background-color: #FFA500;">
              <div class="marker-icon">
                <i class="fa fa-building" aria-hidden="true"></i>
              </div>
              <div class="marker-title">${location.name || 'Unnamed Location'}</div>
            </div>
            <div class="marker-details">
              <div class="marker-type">
                <strong>Type:</strong> Самбар (Sambar)
              </div>
              <div class="marker-location">
                <strong>District:</strong> ${location.khorooInfo?.district?.toUpperCase() || 'Unknown'}<br>
                <strong>Khoroo:</strong> ${location.khorooInfo?.khoroo || 'N/A'}
              </div>
              <div class="marker-coordinates">
                <div>
                  <i class="fa fa-map-marker" aria-hidden="true"></i>
                  <span>${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}</span>
                </div>
              </div>
              <div class="marker-date">
                <i class="fa fa-calendar" aria-hidden="true"></i>
                <span>Created: ${location.createdAt ? new Date(location.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 300
      });
      
      infoWindows.push(infoWindow);
      marker.infoWindow = infoWindow;
      
      marker.addListener("click", () => {
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        
        infoWindow.open({
          anchor: marker,
          map: mapRef.current,
        });
        
        setActiveInfoWindow(infoWindow);
        
        // Toggle shons and lines related to this sambar
        const sambarId = location._id;
        console.log('Sambar clicked:', sambarId);
        console.log('Current selectedSambarId:', selectedSambarId);
        console.log('Related shons:', shonLocations.filter(shon => 
          shon.sambarCode === sambarId || 
          shon.sambarId === sambarId
        ));
        console.log('Related lines:', allLines.filter(line => 
          line.sambarCode === sambarId || 
          line.sambarId === sambarId
        ));
          if (selectedSambarId === sambarId) {
          // If clicking the same sambar again, show all sambars and hide shons/lines
          setShowShons(false);
          setShowLines(false);
          setSelectedSambarId(null);
        } else {
          // Show only this sambar and its related shons and lines
          setShowShons(true);
          setShowLines(true);
          setSelectedSambarId(sambarId);
        }
      });
      
      return marker;
    }) : [];      const shonMarkers = showShons ? shonLocations
      .filter(location => 
        location && 
        location.coordinates && 
        location.coordinates.lat && 
        location.coordinates.lng && 
        // Only show shons related to the selected sambar if one is selected
        (!selectedSambarId || 
          (selectedSambarId && (
            // Try different ways to match the relationship
            location.sambarCode === selectedSambarId || 
            location.sambarId === selectedSambarId ||
            // Find the sambar by ID and match with its name
            (sambarLocations.find(s => s._id === selectedSambarId)?.name === location.sambarCode)
          ))
        ) //
      )
      .map((location) => {
      const marker = new google.maps.Marker({
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            generateShonMarkerSVG(location.name, location.color, location.shape)
          ),
          scaledSize: new google.maps.Size(40, 42),
          anchor: new google.maps.Point(20, 42)
        },
        title: location.name,
        map: null
      });
      
      const contentString = `
        <div class="shon-marker">
          <div class="marker-content">
            <div class="marker-header" style="background-color: #32CD32;">
              <div class="marker-icon">
                <i class="fa fa-lightbulb" aria-hidden="true"></i>
              </div>
              <div class="marker-title">${location.name || 'Unnamed Location'}</div>
            </div>
            <div class="marker-details">
              <div class="marker-type">
                <strong>Type:</strong> Шон (Shon)
              </div>
              <div class="marker-location">
                <strong>District:</strong> ${location.khorooInfo?.district?.toUpperCase() || 'Unknown'}<br>
                <strong>Khoroo:</strong> ${location.khorooInfo?.khoroo || 'N/A'}
              </div>
              <div class="marker-coordinates">
                <div>
                  <i class="fa fa-map-marker" aria-hidden="true"></i>
                  <span>${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}</span>
                </div>
              </div>
              <div class="marker-date">
                <i class="fa fa-calendar" aria-hidden="true"></i>
                <span>Created: ${location.createdAt ? new Date(location.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 300
      });
      
      infoWindows.push(infoWindow);
      marker.infoWindow = infoWindow;
      
      marker.addListener("click", () => {
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        
        infoWindow.open({
          anchor: marker,
          map: mapRef.current,
        });
        
        setActiveInfoWindow(infoWindow);
      });
      
      return marker;
    }) : [];     const allMarkers = [...sambarMarkers, ...shonMarkers];
    markersRef.current = allMarkers;
    
    // Only use clusterer when no sambar is selected (to avoid clustering the single sambar with its shons)
    if (!selectedSambarId) {
      markerClustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: allMarkers,
        gridSize: 60,
        maxZoom: 15 
      });
    } else {
      // When a sambar is selected, just add all markers to the map directly
      allMarkers.forEach(marker => marker.setMap(mapRef.current));
    }

    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => {
        if (marker.label) {
          marker.label.close();
        }
        marker.setMap(null);
      });
    };
  }, [sambarLocations, shonLocations, isLoaded, showSambars, showShons, showLines, selectedSambarId]);
  // useEffect for filtering shons and lines based on selected sambar
  useEffect(() => {
    // If no sambar is selected, keep all items hidden
    if (!selectedSambarId) {
      setShowShons(false);
      setShowLines(false);
      return;
    }
    
    // Find the selected sambar to get its code/name
    const selectedSambar = sambarLocations.find(sambar => sambar._id === selectedSambarId);
    if (!selectedSambar) {
      console.log('Selected sambar not found in sambarLocations array:', selectedSambarId);
      return;
    }
    
    const sambarName = selectedSambar.name;
    console.log('Selected sambar name:', sambarName);
    
    // Filter shons related to the selected sambar (using sambarCode which might be the name)
    const relatedShons = shonLocations.filter(shon => 
      shon.sambarCode === sambarName || 
      shon.sambarCode === selectedSambarId ||
      shon.sambarId === selectedSambarId
    );
    console.log('Found related shons:', relatedShons.length);
    
    // Filter lines related to the selected sambar
    const relatedLines = allLines.filter(line => 
      line.sambarCode === sambarName ||
      line.sambarCode === selectedSambarId ||
      line.sambarId === selectedSambarId
    );
    console.log('Found related lines:', relatedLines.length);
    
    // If there are related items, show them
    if (relatedShons.length > 0 || relatedLines.length > 0) {
      setShowShons(true);
      setShowLines(true);
    }
  }, [selectedSambarId, shonLocations, allLines]);

  const handleMapClick = (event) => {
    if (!kmlUrl) {
      setErrorMessage("Please select a district first");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
  };
  
  const handleSaveLocation = async () => {
    if (!selectedLocation || !locationName.trim()) {
      setSaveStatus({
        message: 'Please provide a name for this location',
        isError: true
      });
      return;
    }
    
    setLoading(true);
    setSaveStatus({ message: '', isError: false });
      try {      
      const savedKhorooInfo = prepareSavedKhorooInfo(locationName);
      
      if (!savedKhorooInfo) {
        setSaveStatus({
          message: 'Could not determine district and khoroo for saving',
          isError: true
        });
        setLoading(false);
        return;
      }
      console.log(`Saving sambar with name: ${locationName}, khorooInfo:`, savedKhorooInfo);
      
      const response = await fetch(`http://localhost:3001/api/sambar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: locationName, 
          coordinates: selectedLocation,
          khorooInfo: savedKhorooInfo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus({
          message: 'Sambar saved!',
          isError: false
        });
        setLocationName('');
        
        // Update sambar locations
        setSambarLocations(prev => [...prev, data.data]);
      } else {
        setSaveStatus({
          message: data.message || 'Failed to save location',
          isError: true
        });
      }
    } catch (error) {
      console.error('Error saving location:', error);
      setSaveStatus({
        message: 'Error connecting to server',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  return isLoaded ? (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '80vh' }}>      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onClick={handleMapClick}        onLoad={map => {
          mapRef.current = map;
        }}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true
        }}
      >        {/* Show current selected loc */}        {selectedLocation && (
          <Marker 
            position={selectedLocation}
            icon={createMarkerIcon('Selected', 40, locationType)}
          />
        )}
        
        {/* Markers are now handled by the clusterer in useEffect */}
        
        {kmlUrl && (
          <KmlLayer 
            url={kmlUrl}
            options={{ 
              preserveViewport: true,
              suppressInfoWindows: true,
              clickable: true
            }}
            onLoad={kmlLayer => {
              kmlLayerRef.current = kmlLayer;
              
              if (kmlLayer) {
                google.maps.event.addListener(kmlLayer, 'click', handleKmlClick);
              }
            }}
          />
        )}        {/* Render lines when showLines is true and filtered by selectedSambarId */}
        {showLines && allLines
          .filter(line => 
            !selectedSambarId || 
            line.sambarCode === selectedSambarId || 
            line.sambarId === selectedSambarId ||
            // Find the sambar by ID and match with its name
            (selectedSambarId && sambarLocations.find(s => s._id === selectedSambarId)?.name === line.sambarCode)
          )
          .map((line, index) => (
          <Polyline
            key={line._id || index}
            path={line.coordinates}
            options={{
              strokeColor: '#DC143C', // Dark red color
              strokeOpacity: 0.8,
              strokeWeight: 3,
              clickable: false
            }}
          />
        ))}
      </GoogleMap>
      
      {/* overlay */}      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        width: '350px',
        zIndex: 10
      }}>        <h3 style={{ margin: '0 0 15px', fontSize: '18px' }}>Дүүрэг & Хороо</h3>
        
        {/* Location Type Selector for Adding New Location */}
        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '500' }}>Add New Location Type:</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                flex: 1,
                padding: '10px 8px',
                backgroundColor: '#FFA500',
                color: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'default',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa fa-building" style={{ marginRight: '8px' }}></i>
              Самбар
            </button>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: '#666', 
            margin: '8px 0 0 0',
            fontStyle: 'italic'
          }}>
            
          </p>
        </div>
          {/* Location Stats Display */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>          <div 
            onClick={() => {
              // If a sambar is selected, clicking this will clear the selection
              if (selectedSambarId) {
                setSelectedSambarId(null);
              } else {
                // Toggle all sambars visibility
                setShowSambars(!showSambars);
              }
            }}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '8px',
              backgroundColor: showSambars ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px',
              border: showSambars ? '1px solid rgba(255, 165, 0, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              opacity: showSambars ? 1 : 0.6,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa fa-building" style={{ color: '#FFA500', fontSize: '18px', marginBottom: '5px' }}></i>            <span style={{ fontWeight: '500' }}>Самбар</span>
            <span>{selectedSambarId ? '1 / ' + sambarLocations.length : sambarLocations.length}</span>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {selectedSambarId ? 'Selected Only' : (showSambars ? 'Showing All' : 'Hidden')}
            </div>
          </div>          <div 
            onClick={() => setShowShons(!showShons)}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '8px',
              backgroundColor: showShons ? 'rgba(50, 205, 50, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px',
              border: showShons ? '1px solid rgba(50, 205, 50, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
              cursor: selectedSambarId ? 'pointer' : 'not-allowed',
              opacity: selectedSambarId ? (showShons ? 1 : 0.6) : 0.4,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa fa-lightbulb" style={{ color: '#32CD32', fontSize: '18px', marginBottom: '5px' }}></i>
            <span style={{ fontWeight: '500' }}>Шон</span>            <span>
              {selectedSambarId 
                ? shonLocations.filter(shon => 
                    shon.sambarCode === selectedSambarId || 
                    shon.sambarId === selectedSambarId ||
                    (sambarLocations.find(s => s._id === selectedSambarId)?.name === shon.sambarCode)
                  ).length
                : shonLocations.length}
            </span>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {selectedSambarId ? (showShons ? 'Showing' : 'Hidden') : 'Select Sambar'}
            </div>
          </div>
          <div 
            onClick={() => setShowLines(!showLines)}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '8px',
              backgroundColor: showLines ? 'rgba(70, 130, 180, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px',
              border: showLines ? '1px solid rgba(70, 130, 180, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
              cursor: selectedSambarId ? 'pointer' : 'not-allowed',
              opacity: selectedSambarId ? (showLines ? 1 : 0.6) : 0.4,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa fa-connectdevelop" style={{ color: '#4682B4', fontSize: '18px', marginBottom: '5px' }}></i>
            <span style={{ fontWeight: '500' }}>Шугам</span>            <span>
              {selectedSambarId 
                ? allLines.filter(line => 
                    line.sambarCode === selectedSambarId || 
                    line.sambarId === selectedSambarId ||
                    (sambarLocations.find(s => s._id === selectedSambarId)?.name === line.sambarCode)
                  ).length
                : allLines.length}
            </span>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {selectedSambarId ? (showLines ? 'Showing' : 'Hidden') : 'Select Sambar'}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500' }}>
            Дүүрэг сонгох:
          </label>
          <select 
            value={selectedDistrict} 
            onChange={handleDistrictChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '15px'
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
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500' }}>
              Хороо сонгох:
            </label>
            <select 
              value={selectedKhoroo} 
              onChange={handleKhorooChange}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '15px'
              }}
            >
              <option value="">-- Бүх хороо --</option>
              {generateKhorooOptions().map(number => (
                <option key={number} value={number}>
                  {number}-р хороо
                </option>
              ))}
            </select>
          </div>
        )}
        
        {kmlLoading && <p style={{ fontSize: '15px', margin: '10px 0', fontWeight: '500' }}>KML loading...</p>}
        
        {kmlUrl && (
          <div style={{ 
            margin: '15px 0', 
            padding: '12px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '6px',
            fontSize: '15px'
          }}>
            <p style={{ margin: '0' }}>
              <strong>Current KML:</strong> {selectedDistrict} {selectedKhoroo ? `- ${selectedKhoroo} хороо` : '(бүх хороо)'}
            </p>
          </div>
        )}
        
        {/*loc info */}
        {selectedLocation && (
          <div style={{ 
            borderTop: '1px solid #ddd', 
            marginTop: '20px', 
            paddingTop: '20px' 
          }}>
            <h4 style={{ margin: '0 0 15px', fontSize: '16px' }}>
              {locationType === 'sambar' ? 'Самбар' : 'Шон'} Location Information
            </h4>
            
            <table style={{ width: '100%', fontSize: '15px', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '500', width: '35%' }}>Latitude:</td>
                  <td>{selectedLocation.lat.toFixed(6)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>Longitude:</td>
                  <td>{selectedLocation.lng.toFixed(6)}</td>
                </tr>
                {khorooInfo && khorooInfo.name && (
                  <tr>
                    <td style={{ fontWeight: '500' }}>Area:</td>
                    <td>{khorooInfo.name}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ fontWeight: '500' }}>Name:</td>
                  <td>
                    <input
                      type="text"
                      placeholder="Enter location name"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '15px'
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={handleSaveLocation}
                disabled={loading || !locationName.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: locationType === 'sambar' ? '#FFA500' : '#32CD32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !locationName.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !locationName.trim() ? '0.7' : '1',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Saving...' : `Save ${locationType === 'sambar' ? 'Самбар' : 'Шон'}`}
              </button>
              
              {saveStatus.message && (
                <p style={{
                  margin: '12px 0 0',
                  color: saveStatus.isError ? '#721c24' : '#155724',
                  fontSize: '15px'
                }}>
                  {saveStatus.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div style={{ 
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          {errorMessage}
        </div>
      )}
    </div>
  ) : <div>Loading Map...</div>;
}

export default React.memo(Map);