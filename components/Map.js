import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, KmlLayer, InfoWindow } from '@react-google-maps/api';
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
  const [showShons, setShowShons] = useState(true);
  
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
            name: shon.code || shon.name || 'Unnamed Shon'
          }));
          setShonLocations(transformedShons);
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
      .filter(location => location && location.coordinates && location.coordinates.lat && location.coordinates.lng)
      .map((location) => {
      const marker = new google.maps.Marker({
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        icon: createMarkerIcon(location.name || 'Unnamed', 40, 'sambar'),
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
      });
      
      return marker;
    }) : []; 
    
    const shonMarkers = showShons ? shonLocations
      .filter(location => location && location.coordinates && location.coordinates.lat && location.coordinates.lng)
      .map((location) => {
      const marker = new google.maps.Marker({
        position: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng
        },
        icon: createMarkerIcon(location.name || 'Unnamed', 40, 'shon'),
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
    }) : []; 

    const allMarkers = [...sambarMarkers, ...shonMarkers];
    markersRef.current = allMarkers;
    
    markerClustererRef.current = new MarkerClusterer({
      map: mapRef.current,
      markers: allMarkers,
      gridSize: 60,
      maxZoom: 15 
    });

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
  }, [sambarLocations, shonLocations, isLoaded, showSambars, showShons]);

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
        )}
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
            Note: To add Shons, click the "Шон" button on an existing Sambar marker
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
        }}>
          <div 
            onClick={() => setShowSambars(!showSambars)}
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
            <i className="fa fa-building" style={{ color: '#FFA500', fontSize: '18px', marginBottom: '5px' }}></i>
            <span style={{ fontWeight: '500' }}>Самбар</span>
            <span>{sambarLocations.length}</span>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {showSambars ? 'Showing' : 'Hidden'}
            </div>
          </div>
          <div 
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
              cursor: 'pointer',
              opacity: showShons ? 1 : 0.6,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa fa-lightbulb" style={{ color: '#32CD32', fontSize: '18px', marginBottom: '5px' }}></i>
            <span style={{ fontWeight: '500' }}>Шон</span>
            <span>{shonLocations.length}</span>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {showShons ? 'Showing' : 'Hidden'}
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