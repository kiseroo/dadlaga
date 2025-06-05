import React, { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px', // Increased height for better map visibility with overlay
  position: 'relative'
};

const center = {
  lat: 47.9184,
  lng: 106.9177
};

function Map() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [saveStatus, setSaveStatus] = useState({ message: '', isError: false });
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4"
  });

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    // Set the selected location without moving the map
    setSelectedLocation({
      lat,
      lng
    });
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
      const response = await fetch('http://localhost:3001/api/sambar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: locationName,
          coordinates: selectedLocation
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveStatus({
          message: 'Location saved!',
          isError: false
        });
        setLocationName('');
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
    <div className="map-container">
      <div className="map-wrapper">
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
          {selectedLocation && (
            <Marker position={selectedLocation} />
          )}
          
          {/* Overlay on map */}
          {selectedLocation && (
            <div className="map-overlay">
              <div className="overlay-content">
                <table className="location-info-table">
                  <tbody>
                    <tr>
                      <td className="info-label">Latitude:</td>
                      <td className="info-value">{selectedLocation.lat.toFixed(6)}</td>
                    </tr>
                    <tr>
                      <td className="info-label">Longitude:</td>
                      <td className="info-value">{selectedLocation.lng.toFixed(6)}</td>
                    </tr>
                    <tr>
                      <td className="info-label">Name:</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter location name"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          className="location-name-input"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="button-cell">
                        <button 
                          onClick={handleSaveLocation}
                          className="save-location-button"
                          disabled={loading || !locationName.trim()}
                        >
                          {loading ? 'Saving...' : 'Save Location'}
                        </button>
                        
                        {saveStatus.message && (
                          <p className={saveStatus.isError ? "error-message" : "success-message"}>
                            {saveStatus.message}
                          </p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GoogleMap>
      </div>
    </div>
  ) : <div>Loading Map...</div>;
}

export default React.memo(Map);
