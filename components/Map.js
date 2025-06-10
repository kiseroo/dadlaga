import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Script from 'next/script';
import { normalizeCoordinates, parseKML, processPoints } from '../utils/kmlHelper';

const containerStyle = {
  width: '100%',
  height: '500px', 
  position: 'relative'
};

// Center on Ulaanbaatar, Mongolia
const center = {
  lat: 47.9184,
  lng: 106.9177
};

// District prefixes in Mongolian
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

// District khoroo counts
const districtKhorooMap = {
  'bgd': 25,  // Баянгол has 25 khoroos
  'bhd': 2,   // Багахангай has 2 khoroos
  'bnd': 5,   // Баянзүрх has 5 khoroos
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
  const [kmlStatus, setKmlStatus] = useState('');
  const [kmlLayers, setKmlLayers] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [activeKhoroos, setActiveKhoroos] = useState([]);
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAs_IP5TbdSKKZU27Z7Ur3HAreuJ9xlhJ4"
  });

  // Clear all existing KML layers
  const clearKMLLayers = () => {
    kmlLayers.forEach(layer => {
      if (layer) layer.setMap(null);
    });
    setKmlLayers([]);
    
    // Clear data layer if it exists
    if (dataLayerRef.current && mapRef.current) {
      dataLayerRef.current.forEach(feature => {
        dataLayerRef.current.remove(feature);
      });
    }
  };
  
  // Function to load a KML file directly using fetch
  const loadKMLDirect = async (district, khoroo = '') => {
    if (!mapRef.current) {
      console.error('Map not loaded yet');
      return;
    }
    
    setKmlStatus('Loading KML...');
    setLoading(true);
    
    try {
      // Clear previous KML layers
      clearKMLLayers();
      
      // Construct the API URL
      const timestamp = new Date().getTime(); // Prevents caching
      let apiUrl;
      if (khoroo) {
        apiUrl = `/api/serve-kml?district=${district}&khoroo=${khoroo}&t=${timestamp}`;
      } else {
        apiUrl = `/api/serve-kml?district=${district}&t=${timestamp}`;
      }
      
      console.log('Fetching KML from:', apiUrl);
      
      // First, try direct KML Layer loading (the most reliable method for all districts)
      try {
        // Get the full URL to the KML file
        const fullKmlUrl = `${window.location.origin}${apiUrl}`;
        console.log('Loading KML directly from:', fullKmlUrl);
        
        const kmlLayer = new google.maps.KmlLayer({
          url: fullKmlUrl,
          map: mapRef.current,
          preserveViewport: false
        });
        
        // Add event listener for status changes
        kmlLayer.addListener('status_changed', () => {
          const status = kmlLayer.getStatus();
          console.log(`KML Layer Status: ${status}`);
          setKmlStatus(`KML status: ${status}`);
          
          if (status !== 'OK') {
            console.error(`KML loading error: ${status}`);
          }
        });
        
        // Track KML layers for cleanup later
        setKmlLayers(prev => [...prev, kmlLayer]);
        
        // After a short delay, check if the layer loaded properly
        setTimeout(async () => {
          // If KmlLayer doesn't work, fall back to manual loading
          if (kmlLayer.getStatus() !== 'OK') {
            console.log('KmlLayer not working, trying manual loading...');
            kmlLayer.setMap(null);
            
            // Fallback to fetch and manual loading
            await loadKMLManually(district, khoroo);
          }
        }, 2000); // Check after 2 seconds
        
        return; // Exit early if KmlLayer is used
      } catch (kmlLayerError) {
        console.error('Error with KmlLayer approach:', kmlLayerError);
        // Continue to manual loading approach
      }
      
      // If KmlLayer failed, try manual loading
      await loadKMLManually(district, khoroo);
      
    } catch (error) {
      console.error('Error loading KML:', error);
      setKmlStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Manual loading of KML file using fetch and parsing
  const loadKMLManually = async (district, khoroo = '') => {
    // Construct the API URL
    const timestamp = new Date().getTime(); // Prevents caching
    let apiUrl;
    if (khoroo) {
      apiUrl = `/api/serve-kml?district=${district}&khoroo=${khoroo}&t=${timestamp}`;
    } else {
      apiUrl = `/api/serve-kml?district=${district}&t=${timestamp}`;
    }
    
    try {
      // Fetch the KML file
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error fetching KML: ${response.statusText}`);
      }
      
      const kmlText = await response.text();
      
      // Parse the KML content
      const kmlDoc = parseKML(kmlText);
      if (!kmlDoc) {
        throw new Error('Failed to parse KML content');
      }
      
      console.log(`KML document parsed successfully for ${district}${khoroo ? `-${khoroo}` : ''}`);
      
      // Initialize Data layer if needed
      if (!dataLayerRef.current) {
        dataLayerRef.current = new google.maps.Data({
          map: mapRef.current
        });
      }
      
      // Customize styling for the data layer
      dataLayerRef.current.setStyle({
        fillColor: selectedDistrict ? selectedDistrict.color : '#4285f4',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: selectedDistrict ? selectedDistrict.color : '#4285f4'
      });
      
      try {
        // Try using the toGeoJSON library to convert KML to GeoJSON
        if (window.toGeoJSON && window.toGeoJSON.kml) {
          console.log('Converting KML to GeoJSON using toGeoJSON...');
          
          // Try to convert to GeoJSON
          const geoJson = window.toGeoJSON.kml(kmlDoc);
          console.log('GeoJSON conversion result:', geoJson);
          
          if (geoJson && geoJson.features && geoJson.features.length > 0) {
            dataLayerRef.current.addGeoJson(geoJson);
            setKmlStatus('KML loaded successfully using GeoJSON conversion');
            
            // Set viewport to bounds of the loaded data
            const bounds = new google.maps.LatLngBounds();
            dataLayerRef.current.forEach(feature => {
              processPoints(feature.getGeometry(), bounds.extend, bounds);
            });
            
            mapRef.current.fitBounds(bounds);
          } else {
            throw new Error('GeoJSON conversion produced empty or invalid result');
          }
        } else {
          throw new Error('toGeoJSON library not available');
        }
      } catch (geoJsonError) {
        console.error('Error with GeoJSON conversion:', geoJsonError);
        
        // Fallback to manual coordinate extraction
        try {
          const placemarks = kmlDoc.getElementsByTagName('Placemark');
          if (placemarks.length === 0) {
            throw new Error('No Placemarks found in KML');
          }
          
          let anyCoordinatesFound = false;
          const bounds = new google.maps.LatLngBounds();
          
          // Process each placemark
          for (let i = 0; i < placemarks.length; i++) {
            const placemark = placemarks[i];
            const coordsElements = placemark.getElementsByTagName('coordinates');
            
            if (coordsElements.length === 0) {
              console.warn(`No coordinates found in Placemark ${i}`);
              continue;
            }
            
            // Process each coordinates element
            for (let j = 0; j < coordsElements.length; j++) {
              const coordsText = coordsElements[j].textContent.trim();
              const normalizedCoords = normalizeCoordinates(coordsText);
              
              if (!normalizedCoords || normalizedCoords.length === 0) {
                console.warn(`Invalid coordinates in Placemark ${i}, element ${j}`);
                continue;
              }
              
              // Create polygon points
              const polygonCoords = normalizedCoords.map(coord => {
                const point = new google.maps.LatLng(coord.lat, coord.lng);
                bounds.extend(point);
                return point;
              });
              
              if (polygonCoords.length < 3) {
                console.warn('Not enough points for a polygon, skipping');
                continue;
              }
              
              // Create polygon
              const polygon = new google.maps.Polygon({
                paths: polygonCoords,
                strokeColor: selectedDistrict ? selectedDistrict.color : '#4285f4',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: selectedDistrict ? selectedDistrict.color : '#4285f4',
                fillOpacity: 0.35,
                map: mapRef.current
              });
              
              setKmlLayers(prev => [...prev, polygon]);
              anyCoordinatesFound = true;
            }
          }
          
          if (anyCoordinatesFound) {
            setKmlStatus('KML loaded successfully using manual extraction');
            mapRef.current.fitBounds(bounds);
          } else {
            throw new Error('No valid coordinates found in KML');
          }
        } catch (manualError) {
          console.error('Manual extraction failed:', manualError);
          setKmlStatus(`Error: Failed to load KML data: ${manualError.message}`);
        }
      }
    } catch (error) {
      console.error('Manual KML loading failed:', error);
      setKmlStatus(`Error: Manual loading failed: ${error.message}`);
    }
  };
  
  // Function to load a specific KML file using KMLLayer (keep as backup)
  const loadKMLFile = (filename) => {
    if (!mapRef.current) {
      console.error('Map not loaded yet');
      return null;
    }
    
    setKmlStatus(`Loading ${filename}...`);
    // Parse the filename to get district and khoroo
    let district, khoroo;
    
    if (filename.includes('-')) {
      // Format: bgd-1
      const parts = filename.split('-');
      district = parts[0];
      khoroo = parts[1];
    } else {
      // Format: bgd (main district)
      district = filename;
    }
    
    // Use direct loading method instead of KMLLayer
    loadKMLDirect(district, khoroo);
    
    return null; // Don't return a KML layer anymore
  };
  
  // Fetch and display available khoroos for the selected district
  const fetchKhorooFiles = async (districtCode) => {
    // Get the count of khoroos for this district
    const khorooCount = districtKhorooMap[districtCode] || 25; // Default to 25 if unknown
    
    setKmlStatus(`Loading khoroo list for ${districtCode}...`);
    
    // Create array of available khoroo numbers
    const khorooNumbers = Array.from({ length: khorooCount }, (_, i) => i + 1);
    
    // Check if khoroos exist by making API calls
    try {
      // Make an API call to check which files actually exist
      const response = await fetch(`/api/list-khoroos?district=${districtCode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.khoroos && Array.isArray(data.khoroos)) {
          setActiveKhoroos(data.khoroos);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching khoroo list:', error);
    }
    
    // Fallback to the predefined count if API failed
    setActiveKhoroos(khorooNumbers);
  };
  
  // Handle district selection - loads all khoroos for that district
  const handleDistrictSelect = (district) => {
    // Don't reload if already selected
    if (selectedDistrict?.code === district.code) return;
    
    setSelectedDistrict(district);
    setKmlStatus(`Loading ${district.name}...`);
    
    // Clear existing layers
    clearKMLLayers();
    
    // Load district KML using the direct method
    loadKMLDirect(district.code);
    
    // Get all khoroo KML files for this district
    fetchKhorooFiles(district.code);
    
    // Log district information for debugging
    console.log(`Selected district: ${district.name} (${district.code})`);
    console.log(`Expected khoroo count: ${districtKhorooMap[district.code] || 'unknown'}`);
  };
  
  // Load a specific khoroo KML
  const handleKhorooSelect = (khorooNum) => {
    if (!selectedDistrict) return;
    
    setKmlStatus(`Loading ${selectedDistrict.name} Khoroo ${khorooNum}...`);
    
    // Clear existing layers
    clearKMLLayers();
    
    // Load the specific khoroo using direct method
    try {
      console.log(`Loading khoroo: ${selectedDistrict.code}-${khorooNum}`);
      loadKMLDirect(selectedDistrict.code, khorooNum);
      
      // Track which district and khoroo is currently selected for UI state
      const filteredKhoroos = [];
      filteredKhoroos.push(parseInt(khorooNum));
      setActiveKhoroos(filteredKhoroos);
    } catch (error) {
      console.error('Error in handleKhorooSelect:', error);
      setKmlStatus(`Error loading khoroo: ${error.message}`);
    }
  };
  
  // Set a default district when map loads
  useEffect(() => {
    if (isLoaded && mapRef.current && districts.length > 0 && !selectedDistrict) {
      // Default to first district
      handleDistrictSelect(districts[0]);
    }
    
    // Load toGeoJSON utility if needed
    const loadToGeoJSON = () => {
      if (!window.toGeoJSON) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@mapbox/togeojson@0.16.0/togeojson.js';
        script.async = true;
        document.body.appendChild(script);
        return script;
      }
      return null;
    };
    
    const script = loadToGeoJSON();
    
    return () => {
      // Clean up script if we added it
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [isLoaded]);

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    setSelectedLocation({
      lat,
      lng
    });
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleMapUnmount = () => {
    mapRef.current = null;
  };
  
  // Render khoroo buttons in a grid
  const renderKhorooButtons = () => {
    if (!activeKhoroos.length) {
      return (
        <div style={{ padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          No khoroo files found for this district. Try selecting a different district.
        </div>
      );
    }
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '5px', 
        marginTop: '10px' 
      }}>
        {activeKhoroos.map(khorooNum => (
          <button 
            key={khorooNum}
            onClick={() => handleKhorooSelect(khorooNum)}
            style={{ 
              padding: '10px', 
              background: selectedDistrict ? selectedDistrict.color + '33' : '#f0f0f0', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: selectedDistrict ? '#333' : '#000'
            }}
          >
            {khorooNum}
          </button>
        ))}
      </div>
    );
  };
  
  // Show all khoroos button
  const handleShowAllKhoroos = () => {
    if (!selectedDistrict) return;
    
    setKmlStatus(`Loading all ${selectedDistrict.name} khoroos...`);
    
    // Clear existing layers
    clearKMLLayers();
    
    // Load the entire district KML
    loadKMLDirect(selectedDistrict.code);
  };

  if (!isLoaded) {
    return <div>Loading Google Maps...</div>;
  }

  return (
    <div>
      <Script src="/togeojson.js" strategy="beforeInteractive" />
      
      <h2>Location Map</h2>
      
      {/* Status messages */}
      {kmlStatus && (
        <div style={{ 
          margin: '10px 0', 
          padding: '10px', 
          background: '#f0f0f0',
          borderRadius: '4px' 
        }}>
          {kmlStatus}
          {loading && <span> Loading...</span>}
        </div>
      )}
      
      {/* District selection */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        marginBottom: '15px' 
      }}>
        {districts.map(district => (
          <button 
            key={district.code}
            onClick={() => handleDistrictSelect(district)}
            style={{ 
              margin: '5px 0',
              padding: '10px',
              background: selectedDistrict?.code === district.code ? district.color : '#ffffff',
              color: selectedDistrict?.code === district.code ? '#ffffff' : '#000000',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              border: `1px solid ${district.color}`
            }}
          >
            {district.name}
          </button>
        ))}
      </div>
      
      {/* Khoroo heading */}
      {selectedDistrict && (
        <div style={{ marginBottom: '10px' }}>
          <h3>Khoroos / Хороод</h3>
          {renderKhorooButtons()}
          
          <button 
            onClick={handleShowAllKhoroos}
            style={{ 
              marginTop: '10px',
              padding: '10px',
              background: '#4caf50',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%',
              border: 'none'
            }}
          >
            Show All {selectedDistrict.name}
          </button>
        </div>
      )}
      
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onClick={handleMapClick}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
          />
        )}
      </GoogleMap>
      
      {/* Script to load toGeoJSON */}
      <Script src="https://unpkg.com/@mapbox/togeojson@0.16.0/togeojson.js" strategy="lazyOnload" />
    </div>
  );
}

export default Map;
