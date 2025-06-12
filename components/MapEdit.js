import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, KmlLayer } from '@react-google-maps/api';
import { useJsApiLoader } from '@react-google-maps/api';

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

const MapEdit = ({ initialLocation, onLocationChange, sambar }) => {
  const [initialCenter] = useState(() => {
    if (initialLocation) {
      return {
        lat: parseFloat(initialLocation.lat) || defaultCenter.lat,
        lng: parseFloat(initialLocation.lng) || defaultCenter.lng
      };
    }
    return defaultCenter;
  });

  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (initialLocation) {
      return {
        lat: parseFloat(initialLocation.lat) || defaultCenter.lat,
        lng: parseFloat(initialLocation.lng) || defaultCenter.lng
      };
    }
    return defaultCenter;  });
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const kmlLayerRef = useRef(null); // Add reference for KML layer
  
  const [kmlUrl, setKmlUrl] = useState("");
  const [kmlKey, setKmlKey] = useState(Date.now()); 
  const [kmlVisible, setKmlVisible] = useState(false); 
  const [khorooNumber, setKhorooNumber] = useState(null); 
  
  const getDistrictCodeFromName = (name) => {
    if (!name || !name.includes('_')) return null;
    
    const parts = name.split('_');
    if (parts.length !== 2) return null;
    
    const districtCyrillic = parts[0];
    const districtMap = {
      'ЧД': 'chd',    
      'БЗД': 'bzd',   
      'БГД': 'bgd',   
      'СБД': 'sbd',   
      'СХД ': 'shd',  
      'СХД': 'shd',   
      'ХУД': 'hud',   
      'БХД': 'bhd'    
    };
    
    return {
      districtCode: districtMap[districtCyrillic] || districtCyrillic.toLowerCase(),
      khoroo: parts[1]
    };
  };
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4",
    libraries: ['geometry']
  });
  useEffect(() => {
    console.log("Setting up KML from sambar:", sambar);
    
    if (sambar) {
      try {
        let district = null;
        let khoroo = null;
        
        if (sambar.khorooInfo && sambar.khorooInfo.district) {
          district = sambar.khorooInfo.district.toLowerCase();
          
          if (sambar.khorooInfo.khoroo && sambar.khorooInfo.khoroo !== "All") {
            khoroo = sambar.khorooInfo.khoroo;
            console.log("Using direct khoroo from khorooInfo:", khoroo);
          }
        }
        
        if (!khoroo) {
          // CASE 1: Direct format "district-khoroo" (e.g., "bzd-8")
          if (sambar.name && sambar.name.match(/^[a-z]{3}-\d+$/i)) {
            if (!district) {
              district = sambar.name.split('-')[0].toLowerCase();
            }
            khoroo = sambar.name.split('-')[1];
            console.log("Extracted from name format (district-khoroo):", district, khoroo);
          }
          // CASE 2: Cyrillic format (e.g., "БЗД_8")
          else if (sambar.name && sambar.name.includes('_')) {
            const parts = sambar.name.split('_');
            if (parts.length === 2) {
              const districtMap = {
                'ЧД': 'chd',    
                'БЗД': 'bzd',   
                'БГД': 'bgd',   
                'СБД': 'sbd',   
                'СХД': 'shd',   
                'ХУД': 'hud',   
                'БХД': 'bhd'    
              };
              if (!district) {
                district = districtMap[parts[0]] || parts[0].toLowerCase();
              }
              khoroo = parts[1];
              console.log("Extracted from Cyrillic format:", district, khoroo);
            }
          }
          // CASE 3: Try to find any number in the name as a last resort
          else if (sambar.name) {
            const match = sambar.name.match(/\d+/);
            if (match) {
              khoroo = match[0];
              console.log("Extracted khoroo as last resort from name:", khoroo);
            }
          }
        }
        
        if (!district || !khoroo) {
          console.error("Could not extract district and khoroo information:", sambar);
          setKmlVisible(false);
          return;
        }
        
      
        if (sambar.khorooInfo && 
            sambar.khorooInfo.khoroo && 
            sambar.khorooInfo.khoroo.length === 2 && 
            sambar.khorooInfo.khoroo.startsWith('0') && 
            khoroo.length === 1) {
          khoroo = '0' + khoroo;
          console.log("Preserved leading zero for khoroo:", khoroo);
        }
        
        setKhorooNumber(khoroo);
        
        const baseUrl = "https://datacenter.ublight.mn/images/kml/khoroo2021";
        const url = `${baseUrl}/${district}-${khoroo}.kml`;
        
        const timestamp = Date.now();
        const fullUrl = `${url}?t=${timestamp}`;
        setKmlUrl(fullUrl);
        setKmlKey(timestamp);
        setKmlVisible(true);
        
        console.log("KML URL set:", fullUrl);
      } catch (error) {
        console.error("Error setting KML URL:", error);
        setKmlVisible(false);
      }
    } else {
      console.log("No sambar data available for KML");
      setKmlVisible(false);
    }
  }, [sambar]);
  
  useEffect(() => {
    if (selectedLocation && onLocationChange) {
      onLocationChange({
        lat: parseFloat(selectedLocation.lat),
        lng: parseFloat(selectedLocation.lng)
      });
    }
  }, [selectedLocation, onLocationChange]);
    const handleMapClick = (event) => {
    // Disable direct map clicks - only allow clicking within KML boundaries
    // This prevents placing markers outside the khoroo boundaries
    console.log("Map clicked, but ignoring - only KML clicks allowed");
  };
  
  // Add KML click handler - only this will set the marker position
  const handleKmlClick = (event) => {
    if (event && event.featureData) {
      console.log("KML feature clicked:", event.featureData);
      
      // Only set location if we have valid coordinates
      if (event.latLng) {
        const newPos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        setSelectedLocation(newPos);
        console.log("New marker position set from KML click:", newPos);
      }
    }
  };
  
  if (!isLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Maps...</div>;
  }
  
  return (
    <div className="map-edit-container" style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter} 
        zoom={15}
        onClick={handleMapClick}
        onLoad={map => {
          mapRef.current = map;
          console.log("Map loaded");
          
          if (selectedLocation) {
            map.panTo({
              lat: parseFloat(selectedLocation.lat),
              lng: parseFloat(selectedLocation.lng)
            });
          }
        }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy' 
        }}
      >
        {/* Marker */}
        {selectedLocation && (
          <Marker            key={`marker-${selectedLocation.lat}-${selectedLocation.lng}`} 
            position={selectedLocation}
            draggable={false} // Disable dragging since we want to restrict to KML clicks only
            onLoad={(marker) => {
              markerRef.current = marker;
            }}
          />
        )}
        
        {/* KML Layer */}
        {kmlUrl && kmlVisible && (
          <>
            {/*KML loading mes */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '5px',
                borderRadius: '3px',
                fontSize: '12px',
                zIndex: 100
              }}
            >
              Loading KML layer...
            </div>
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
                  google.maps.event.addListener(kmlLayer, 'click', handleKmlClick);
                  console.log("KML click handler attached");
                }
              }}onError={(error) => {
                console.error("KML Layer error:", error);
                
                if (sambar) {
                  let backupDistrict = null;
                  let backupKhoroo = null;
                  
                  if (sambar.khorooInfo && 
                      sambar.khorooInfo.district && 
                      sambar.khorooInfo.khoroo && 
                      sambar.khorooInfo.khoroo !== "All") {
                    backupDistrict = sambar.khorooInfo.district.toLowerCase();
                    backupKhoroo = sambar.khorooInfo.khoroo;
                    console.log("Backup attempt using khorooInfo:", backupDistrict, backupKhoroo);
                  }
                  else if (sambar.name && sambar.name.match(/^[a-z]{3}-\d+$/i)) {
                    const parts = sambar.name.split('-');
                    backupDistrict = parts[0].toLowerCase();
                    backupKhoroo = parts[1];
                    console.log("Backup attempt using direct format:", backupDistrict, backupKhoroo);
                  }
                  else if (sambar.name && sambar.name.includes('_')) {
                    const parts = sambar.name.split('_');
                    if (parts.length === 2) {
                      const districtMap = {
                        'ЧД': 'chd',
                        'БЗД': 'bzd',
                        'БГД': 'bgd',
                        'СБД': 'sbd',
                        'СХД': 'shd',
                        'ХУД': 'hud',
                        'БХД': 'bhd'
                      };
                      backupDistrict = districtMap[parts[0]] || parts[0].toLowerCase();
                      backupKhoroo = parts[1];
                      console.log("Backup attempt using Cyrillic format:", backupDistrict, backupKhoroo);
                    }
                  }
                  
                  if (backupDistrict && backupKhoroo) {
                    if (backupKhoroo.length === 2 && backupKhoroo.startsWith('0')) {
                      console.log("Preserving leading zero in backup attempt");
                    }
                    
                    const backupUrl = `https://datacenter.ublight.mn/images/kml/khoroo2021/${backupDistrict}-${backupKhoroo}.kml?t=${Date.now()}`;
                    console.log("Trying backup URL:", backupUrl);
                    setKmlUrl(backupUrl);
                    setKmlKey(Date.now());
                  }
                }
              }}
            />
          </>
        )}
      </GoogleMap>
      
      {/* Loc Info */}
      {selectedLocation && (
        <div style={{ 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0' }}>
            <strong>Position:</strong> Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </p>          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
            Click on the blue khoroo area to place marker
          </p>
        </div>
      )}
        {/* Display khoroo inf */}
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
          
          {/* Debug info */}
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
            <strong>KML URL:</strong> {kmlUrl ? kmlUrl.split('?')[0] : 'Not set'}
          </p>
          
          {khorooNumber && (
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#333' }}>
              <strong>Khoroo Number:</strong> {khorooNumber}
            </p>
          )}
          
          {sambar.khorooInfo && (
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
              <strong>Stored District:</strong> {sambar.khorooInfo.district || 'Unknown'}, 
              <strong>Khoroo:</strong> {sambar.khorooInfo.khoroo || 'All'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapEdit;
