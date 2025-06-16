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
  
  // Add district and khoroo state
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedKhoroo, setSelectedKhoroo] = useState('');
  const [khorooInfo, setKhorooInfo] = useState(null);
  const [districtData, setDistrictData] = useState({});
  
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
    const [khorooData, setKhorooData] = useState({});
  
  // Fetch khoroo data for the selected district
  useEffect(() => {
    if (selectedDistrict) {
      const fetchKhorooData = async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/khoroos/district/${selectedDistrict}`);
          const data = await response.json();
          
          if (data.success) {
            // Organize khoroos by number for easy access
            const khoroosObject = {};
            data.data.forEach(khoroo => {
              khoroosObject[khoroo.number] = khoroo;
            });
            setKhorooData(khoroosObject);
            console.log("Khoroo data fetched successfully for district:", selectedDistrict, khoroosObject);
          } else {
            console.error('Failed to fetch khoroo data');
          }
        } catch (error) {
          console.error('Error fetching khoroo data:', error);
        }
      };
      
      fetchKhorooData();
    } else {
      // Reset khoroo data when no district is selected
      setKhorooData({});
    }
  }, [selectedDistrict]);
  // Fetch district data from backend
  useEffect(() => {
    const fetchDistrictData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/districts');
        const data = await response.json();
        
        if (data.success) {
          // Convert array to object with code as key for easier access
          const districtsObject = {};
          data.data.forEach(district => {
            districtsObject[district.code] = district;
          });
          setDistrictData(districtsObject);
          console.log("District data fetched successfully in MapEdit:", districtsObject);
        } else {
          console.error('Failed to fetch district data');
        }
      } catch (error) {
        console.error('Error fetching district data:', error);
      }
    };
    
    fetchDistrictData();
  }, []);

  // Initialize district and khoroo from sambar data
  useEffect(() => {
    if (sambar && sambar.khorooInfo) {
      if (sambar.khorooInfo.district) {
        setSelectedDistrict(sambar.khorooInfo.district.toLowerCase());
      }
      
      if (sambar.khorooInfo.khoroo) {
        setSelectedKhoroo(sambar.khorooInfo.khoroo);
      }
      
      setKhorooInfo(sambar.khorooInfo);
    }
  }, [sambar]);
  // Handle district and khoroo changes
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedKhoroo(''); // Reset khoroo when district changes
    
    // Update khorooInfo
    const updatedInfo = {
      ...khorooInfo,
      district: district,
      khoroo: '' // Reset khoroo
    };
    setKhorooInfo(updatedInfo);
    
    // Notify parent component if callback exists
    if (onKhorooInfoChange) {
      onKhorooInfoChange(updatedInfo);
    }
  };

  const handleKhorooChange = (e) => {
    const khoroo = e.target.value;
    setSelectedKhoroo(khoroo);
    
    // Update khorooInfo
    const updatedInfo = {
      ...khorooInfo,
      khoroo: khoroo
    };
    setKhorooInfo(updatedInfo);
    
    // Notify parent component if callback exists
    if (onKhorooInfoChange) {
      onKhorooInfoChange(updatedInfo);
    }
  };
    const generateKhorooOptions = () => {
    if (!selectedDistrict || !districtData[selectedDistrict]) return [];
    
    const count = districtData[selectedDistrict].khorooCount || 0;
    return Array.from({ length: count }, (_, i) => i + 1);
  };  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    console.log("Setting up KML from district/khoroo selection:", selectedDistrict, selectedKhoroo);
    
    if (selectedDistrict) {
      try {
        let district = selectedDistrict.toLowerCase();
        let khoroo = selectedKhoroo;
        
        if (!khoroo && sambar && sambar.khorooInfo && sambar.khorooInfo.khoroo) {
          khoroo = sambar.khorooInfo.khoroo;
        }
        
        if (!district) {
          const error = "Could not extract district information";
          console.error(error);
          setErrorMsg(error);
          setKmlVisible(false);
          return;
        }
        
        setKhorooNumber(khoroo);
        
        let url = null;
        let error = null;
        
        if (khoroo && khorooData[khoroo] && khorooData[khoroo].boundaries) {
          // Use khoroo boundaries from database
          url = khorooData[khoroo].boundaries;
        } else if (khoroo) {
          // Error - khoroo boundary not found in database
          error = `No boundary data found for khoroo ${khoroo} in district ${district}`;
        } else if (districtData[district] && districtData[district].boundaries) {
          // Use district boundaries from database
          url = districtData[district].boundaries;
        } else {
          // Error - district boundary not found in database
          error = `No boundary data found for district ${district}`;
        }
        
        if (url) {
          const timestamp = Date.now();
          const fullUrl = `${url}?t=${timestamp}`;
          setKmlUrl(fullUrl);
          setKmlKey(timestamp);
          setKmlVisible(true);
          setErrorMsg(null);
          
          console.log("KML URL set:", fullUrl);
        } else {
          console.error(error);
          setErrorMsg(error);
          setKmlVisible(false);
          setKmlUrl('');
        }
      } catch (error) {
        console.error("Error setting KML URL:", error);
        setErrorMsg(`Error: ${error.message || 'Unknown error occurred'}`);
        setKmlVisible(false);
      }
    } else {
      console.log("No district selected for KML");
      setKmlVisible(false);
      setErrorMsg(null);
    }
  }, [selectedDistrict, selectedKhoroo, districtData, khorooData, sambar]);
  
  // The rest of the original useEffect for sambar KML handling can be simplified now
  useEffect(() => {
    if (sambar && !selectedDistrict) {
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
          // Extract from existing sambar name as before...
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
        
        if (district && khoroo) {
          setSelectedDistrict(district);
          setSelectedKhoroo(khoroo);
        }
      } catch (error) {
        console.error("Error extracting district/khoroo from sambar:", error);
      }
    }
  }, [sambar]);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4",
    libraries: ['geometry']
  });

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
    <div className="map-edit-container" style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
      <GoogleMap
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
          <Marker
            key={`marker-${selectedLocation.lat}-${selectedLocation.lng}`} 
            position={selectedLocation}
            draggable={false} // Disable dragging since we want to restrict to KML clicks only
            onLoad={(marker) => {
              markerRef.current = marker;
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
                google.maps.event.addListener(kmlLayer, 'click', handleKmlClick);
                console.log("KML click handler attached");
              }
            }}
            onError={(error) => {
              console.error("KML Layer error:", error);
              
              // Error handling for KML loading failures
              // ...existing error handling code...
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
            </label>            <select 
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
              </label>              <select 
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
          
          {errorMsg && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <p style={{ margin: '0' }}>
                <strong>Error:</strong> {errorMsg}
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

export default MapEdit;
