import React, { useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, KmlLayer } from '@react-google-maps/api';

// Update the containerStyle
const containerStyle = {
  width: '65%',
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1
};

const center = {
  lat: 47.9184,
  lng: 106.9177
};
const districts = [
  { code: 'bgd', name: 'БГД', color: '#4285f4' },
  { code: 'bhd', name: 'БХД', color: '#34a853' },
  { code: 'bnd', name: 'БНД', color: '#fbbc05' },
  { code: 'bzd', name: 'БЗД', color: '#ea4335' },
  { code: 'chd', name: 'ЧД', color: '#aa46bc' },
  { code: 'hud', name: 'ХУД', color: '#26c6da' },
  { code: 'hud1', name: 'ХУД1', color: '#006064' },
  { code: 'nad', name: 'НАД', color: '#ff6d00' },
  { code: 'sbd', name: 'СБД', color: '#9c27b0' },
  { code: 'shd', name: 'СХД', color: '#ff5722' }
];

// Distri%t khoroo counts
const districtKhorooMap = {
  'bgd': 25,  // Баянгол has 25 khoroos
  'bhd': 2,   // Багахангай has 2 khoroos
  'bnd': 5,   // Баянзүрх has 5 khoroос
  'bzd': 43,  // Баянзүрх has 43 khoroos
  'chd': 19,  // Чингэлтэй has 19 khoroos
  'hud': 25,  // Хан-Уул has 25 khoroos
  'hud1': 25, // Хан-Уул1 has 25 khoroос
  'nad': 8,   // Налайх has 8 khoroos
  'sbd': 20,  // Сүхбаатар has 20 khoroos
  'shd': 43   // Сонгинохайрхан has 43 khoroos
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
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: '100vh'
    }}>
      {/* Map Section - Positioned behind */}
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
      </GoogleMap>

      {/* Update Controls Section positioning */}
      <div style={{ 
        position: 'absolute',
        top: 20,
        right: 20, // Changed from left: 20 to right: 20
        zIndex: 2,
        width: '300px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Select Area</h3>
        
        {/* District select */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>District / Дүүрэг</label>
          <select
            onChange={(e) => {
              const selected = districts.find(d => d.code === e.target.value);
              if (selected) {
                handleDistrictSelect(selected);
                setSelectedKhoroo(null);
              }
            }}
            value={selectedDistrict?.code || ''}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">Select District</option>
            {districts.map(district => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Khoroo select */}
        {selectedDistrict && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Khoroo / Хороо</label>
            <select
              onChange={(e) => handleKhorooSelect(e.target.value)}
              value={selectedKhoroo || ''}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="">Бүгд</option>
              {[...Array(districtKhorooMap[selectedDistrict.code])].map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}-р хороо
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Info Form - Moved from overlay */}
        {selectedLocation && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Location Details</h4>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td>Latitude:</td>
                  <td>{selectedLocation.lat.toFixed(6)}</td>
                </tr>
                <tr>
                  <td>Longitude:</td>
                  <td>{selectedLocation.lng.toFixed(6)}</td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ paddingTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Enter location name"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      style={{
                        width: '95%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        marginBottom: '10px'
                      }}
                    />
                    <button 
                      onClick={handleSaveLocation}
                      disabled={loading || !locationName.trim()}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading || !locationName.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Location'}
                    </button>
                    
                    {saveStatus.message && (
                      <p style={{ 
                        color: saveStatus.isError ? '#dc3545' : '#28a745',
                        margin: '10px 0 0 0',
                        fontSize: '14px'
                      }}>
                        {saveStatus.message}
                      </p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  ) : <div>Loading Map...</div>;
}

export default React.memo(Map);
