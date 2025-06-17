import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, KmlLayer, Marker } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import useDistrictKhoroo from '../hooks/useDistrictKhoroo';

const containerStyle = {
  width: '100%', 
  height: '400px', 
  position: 'relative',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const defaultCenter = {
  lat: 47.9184,
  lng: 106.9177
};

const MapEdit = ({ initialLocation, onLocationChange, sambar, onKhorooInfoChange }) => {
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
    console.log("Map clicked, but ignoring - only KML clicks allowed");
  }, []);
  
  const handleKmlClick = useCallback((event) => {
    if (event && event.featureData) {
      console.log("KML feature clicked:", event.featureData);
      
      districtKhoroo.handleKmlClick(event);
      
      if (event.latLng) {
        console.log("New marker position set from KML click");
      }
    }
  }, [districtKhoroo]);
    // Use a memoized callback for map load to prevent unnecessary re-renders
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

  if (!isLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Maps...</div>;
  }
  
  return (
    <div className="map-edit-container" style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>      <GoogleMap
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
          gestureHandling: 'greedy' 
        }}
      >        {/* Custom Styled Marker */}
        {selectedLocation && (
          <Marker
            key={`marker-${selectedLocation.lat}-${selectedLocation.lng}`}
            position={{
              lat: parseFloat(selectedLocation.lat),
              lng: parseFloat(selectedLocation.lng)
            }}
            title={sambar?.name || "Selected Location"}
            onLoad={(marker) => {
              markerRef.current = marker;
            }}            icon={{
              url: 'https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U',
              scaledSize: new google.maps.Size(40, 40), 
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(20, 20) 
            }}
          />
        )}
        
        {/* KML Layer */}
        {kmlUrl && kmlVisible && (
          <KmlLayer
            key={`kml-layer-${kmlKey}`} 
            url={kmlUrl}
            options={{
              preserveViewport: true, 
              suppressInfoWindows: true,
              clickable: true // Make KML layer clickable
            }}
            onLoad={(kmlLayer) => {
              console.log("KML Layer loaded successfully:", kmlUrl);
              kmlLayerRef.current = kmlLayer;
                // Add click handler to KML layer
              if (kmlLayer) {
                // Clear existing click listeners to prevent duplicates
                google.maps.event.clearListeners(kmlLayer, 'click');
                google.maps.event.addListener(kmlLayer, 'click', handleKmlClick);
                console.log("KML click handler attached");
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
    </div>
  );
};

export default React.memo(MapEdit);
