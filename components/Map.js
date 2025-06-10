import React, { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// Update the containerStyle
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
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedKhoroo, setSelectedKhoroo] = useState(null);
  const [kmlLayer, setKmlLayer] = useState(null);
  const mapRef = useRef(null);
  const kmlLayerRef = useRef(null);
  
  
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedKhoroo, setSelectedKhoroo] = useState('');
  const [kmlUrl, setKmlUrl] = useState('');
  const [kmlLoading, setKmlLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [khorooInfo, setKhorooInfo] = useState(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4",
    libraries: ['geometry']
  });

  
  useEffect(() => {
    if (selectedDistrict) {
      setKmlLoading(true);
      
      let url;
      if (selectedKhoroo) {
        
        url = `https://datacenter.ublight.mn/images/kml/khoroo2021/${selectedDistrict}-${selectedKhoroo}.kml`;
      } else {
        
        url = `https://datacenter.ublight.mn/images/kml/khoroo2021/${selectedDistrict}.kml`;
      }
      
      setKmlUrl(url);
      setKmlLoading(false);
      
      setSelectedLocation(null);
      setKhorooInfo(null);
    } else {
      setKmlUrl('');
      setSelectedLocation(null);
      setKhorooInfo(null);
    }
  }, [selectedDistrict, selectedKhoroo]);

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
      const response = await fetch('http://localhost:3001/api/sambar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: locationName,
          coordinates: selectedLocation,
          khorooInfo: khorooInfo
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

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedKhoroo(''); 
    setKhorooInfo(null);
  };

  const handleKhorooChange = (e) => {
    setSelectedKhoroo(e.target.value);
    setKhorooInfo(null);
  };
  
  
  const generateKhorooOptions = () => {
    if (!selectedDistrict || !districtData[selectedDistrict]) return [];
    
    const count = districtData[selectedDistrict].khorooCount;
    return Array.from({ length: count }, (_, i) => i + 1);
  };
  
  
  const handleKmlClick = (event) => {
    if (event && event.featureData) {
      
      const featureData = event.featureData;
      if (featureData.name) {
        setKhorooInfo({
          name: featureData.name,
          district: selectedDistrict,
          khoroo: selectedKhoroo || "All"
        });
      }
      
      
      if (event.latLng) {
        setSelectedLocation({
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        });
      }
    }
  };
  
  // Add base URL for KML files
  const KML_BASE_URL = 'https://datacenter.ublight.mn/images/kml/khoroo2021/';
  
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    
    // Remove existing KML layer if any
    if (kmlLayer) {
      kmlLayer.setMap(null);
    }
    
    // Load new KML layer for selected district
    const kmlUrl = `${KML_BASE_URL}${district.code}.kml`;
    const newKmlLayer = new google.maps.KmlLayer({
      url: kmlUrl,
      map: mapRef.current,
      preserveViewport: false, // Changed to false to zoom to district boundary
      suppressInfoWindows: true,
      clickable: false,
      screenOverlays: false
    });
    
    // Add listener to handle loading status
    newKmlLayer.addListener('status_changed', () => {
      const status = newKmlLayer.getStatus();
      console.log('District KML Layer Status:', status);
      if (status !== 'OK') {
        console.error(`Failed to load district layer: ${status}`);
        return;
      }
    });
    
    setKmlLayer(newKmlLayer);
  };

  // Add new function to handle khoroo selection
  const handleKhorooSelect = (khorooNumber) => {
    setSelectedKhoroo(khorooNumber);
    
    // Remove existing KML layer
    if (kmlLayer) {
      kmlLayer.setMap(null);
    }

    if (!khorooNumber) {
      // If no khoroo selected (Бүгд), show district layer with same zoom behavior as district selection
      const districtKmlUrl = `${KML_BASE_URL}${selectedDistrict.code}.kml`;
      const districtLayer = new google.maps.KmlLayer({
        url: districtKmlUrl,
        map: mapRef.current,
        preserveViewport: false, // Changed to false to match district zoom behavior
        suppressInfoWindows: true,
        clickable: false,
        screenOverlays: false
      });
      
      districtLayer.addListener('status_changed', () => {
        const status = districtLayer.getStatus();
        console.log('District KML Layer Status:', status);
        if (status !== 'OK') {
          console.error(`Failed to load district layer: ${status}`);
          return;
        }
      });
      
      setKmlLayer(districtLayer);
      return;
    }
    
      // Load specific khoroo KML layer with hyphenated naming convention
    const khorooKmlUrl = `${KML_BASE_URL}${selectedDistrict.code}-${khorooNumber}.kml`;
    console.log('Loading KML:', khorooKmlUrl);

    const khorooLayer = new google.maps.KmlLayer({
      url: khorooKmlUrl,
      map: mapRef.current,
      preserveViewport: false, // Changed to false to zoom to khoroo boundary
      suppressInfoWindows: true,
      clickable: false
    });
    
    khorooLayer.addListener('status_changed', () => {
      const status = khorooLayer.getStatus();
      console.log('KML Layer Status:', status);
      if (status !== 'OK') {
        console.error(`Failed to load khoroo layer: ${status}`);
        // Fallback to district layer if khoroo layer fails
        handleKhorooSelect(null);
        return;
      }
    });
    
    setKmlLayer(khorooLayer);
  };

  // Update the return statement layout with new positioning
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
