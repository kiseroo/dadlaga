import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, KmlLayer } from '@react-google-maps/api';
import useDistrictKhoroo from '../hooks/useDistrictKhoroo';

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
  const [savedLocations, setSavedLocations] = useState([]);
  
  const mapRef = useRef(null);
  const kmlLayerRef = useRef(null);
  
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
  });

  useEffect(() => {
    const fetchSavedLocations = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sambar');
        const data = await response.json();
        
        if (data.success) {
          setSavedLocations(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching saved locations:', error);
      }
    };
    
    fetchSavedLocations();
  }, []);

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
      
      console.log(`Saving location with name: ${locationName}, khorooInfo:`, savedKhorooInfo);
      
      const response = await fetch('http://localhost:3001/api/sambar', {
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
          message: 'Location saved!',
          isError: false
        });
        setLocationName('');
        
        setSavedLocations(prev => [...prev, data.data]);
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
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '80vh' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onClick={handleMapClick}
        onLoad={map => {
          mapRef.current = map;
        }}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true
        }}
      >
        {/* Show current selected loc */}
        {selectedLocation && (
          <Marker 
            position={selectedLocation}
            animation={google.maps.Animation.BOUNCE}
          />
        )}
        
        {/* ulaan loc save */}
        {savedLocations.map(location => (
          <Marker 
            key={location._id}
            position={{
              lat: location.coordinates.lat,
              lng: location.coordinates.lng
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF0000',
              fillOpacity: 0.8,
              strokeColor: '#FF0000',
              strokeWeight: 2,
              scale: 8
            }}
            title={location.name}
          />
        ))}
        
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
      
      {/* overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        width: '350px',
        zIndex: 10
      }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '18px' }}>Дүүрэг & Хороо</h3>
        
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
            <h4 style={{ margin: '0 0 15px', fontSize: '16px' }}>Location Information</h4>
            
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
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !locationName.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !locationName.trim() ? '0.7' : '1',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Saving...' : 'Save Location'}
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
