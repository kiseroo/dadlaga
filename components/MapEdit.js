import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, KmlLayer, Marker } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';
import useDistrictKhoroo from '../hooks/useDistrictKhoroo';
import { createMarkerIcon } from '../utils/markerIcon';

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
  activeShonId = null
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
    if (event && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      console.log("Marker dragged to:", { lat, lng });
      
      onLocationChange({ lat, lng });
    }
  }, [onLocationChange]);

  useEffect(() => {
    if (mapRef.current && allShons && allShons.length > 0 && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (initialLocation) {
        bounds.extend({
          lat: parseFloat(initialLocation.lat),
          lng: parseFloat(initialLocation.lng)
        });
      }
      
      allShons.forEach(shon => {
        bounds.extend({
          lat: parseFloat(shon.coordinates.lat),
          lng: parseFloat(shon.coordinates.lng)
        });
      });
      
      if (allShons.length > 0 || initialLocation) {
        mapRef.current.fitBounds(bounds);
        
        if ((allShons.length === 0 && initialLocation) || 
            (allShons.length === 1 && !initialLocation)) {
          const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
            mapRef.current.setZoom(Math.min(15, mapRef.current.getZoom()));
          });
          return () => {
            window.google.maps.event.removeListener(listener);
          };
        }
      }
    }
  }, [mapRef, allShons, initialLocation, isLoaded]);

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
      >        {/* Custom Styled Marker for selected location */}
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
            }}
            icon={createMarkerIcon(sambar?.name || "Selected", 50, locationType)} 
          />
        )}
        
        {/* Active marker */}
        {selectedLocation && (
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
        {allShons && allShons.length > 0 && allShons.map(shon => (
          <Marker
            key={`shon-${shon._id}`}
            position={{
              lat: parseFloat(shon.coordinates.lat),
              lng: parseFloat(shon.coordinates.lng)
            }}
            icon={createMarkerIcon(shon.name, 30, 'shon')}
            opacity={activeShonId === shon._id ? 0.5 : 1} 
            zIndex={activeShonId === shon._id ? 999 : 500} 
            onClick={() => {
              if (onLocationChange && typeof onLocationChange === 'function') {
                console.log("Shon marker clicked:", shon);
              }
            }}
          />
        ))}
        
        {/* KML Layer */}
        {kmlUrl && kmlVisible && (
          <KmlLayer
            key={`kml-layer-${kmlKey}`} 
            url={kmlUrl}
            options={{
              preserveViewport: true, 
              suppressInfoWindows: true,
              clickable: true 
            }}
            onLoad={(kmlLayer) => {
              console.log("KML Layer loaded successfully:", kmlUrl);
              kmlLayerRef.current = kmlLayer;
              if (kmlLayer) {
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
