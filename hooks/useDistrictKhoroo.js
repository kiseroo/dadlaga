import { useState, useEffect } from 'react';

/**
 * @param {Object} options - Configuration options
 * @param {Object} options.initialLocation - Initial location coordinates {lat, lng}
 * @param {Object} options.initialKhorooInfo - Initial khoroo info if available
 * @param {Function} options.onLocationChange - Callback when location changes
 * @param {Function} options.onKhorooInfoChange - Callback when khoroo info changes
 * @returns {Object} All district/khoroo state and handlers
 */
const useDistrictKhoroo = (options = {}) => {
  const {
    initialLocation,
    initialKhorooInfo,
    onLocationChange,
    onKhorooInfoChange
  } = options;

  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  
  const [districtData, setDistrictData] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialKhorooInfo?.district || ''
  );
  const [selectedKhoroo, setSelectedKhoroo] = useState(
    initialKhorooInfo?.khoroo || ''
  );
  const [khorooInfo, setKhorooInfo] = useState(initialKhorooInfo || null);

  const [kmlUrl, setKmlUrl] = useState('');
  const [kmlLoading, setKmlLoading] = useState(false);
  const [kmlVisible, setKmlVisible] = useState(false);
  const [kmlKey, setKmlKey] = useState(Date.now());

  useEffect(() => {
    const fetchDistrictData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/districts');
        const data = await response.json();
        
        if (data.success) {
          setDistrictData(data.data);
          console.log("District data fetched successfully:", data.data);
        } else {
          console.error('Failed to fetch district data');
        }
      } catch (error) {
        console.error('Error fetching district data:', error);
      }
    };
    
    fetchDistrictData();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      setKmlLoading(true);
      
      let url;
      if (selectedKhoroo) {
        url = `https://datacenter.ublight.mn/images/kml/khoroo2021/${selectedDistrict}-${selectedKhoroo}.kml`;
      } else {
        url = `https://datacenter.ublight.mn/images/kml/khoroo2021/${selectedDistrict}.kml`;
      }
      
      const timestamp = Date.now();
      const fullUrl = `${url}?t=${timestamp}`;
      
      setKmlUrl(fullUrl);
      setKmlKey(timestamp);
      setKmlVisible(true);
      setKmlLoading(false);
      
      // Reset location when district/khoroo changes
      if (!initialLocation) {
        setSelectedLocation(null);
      }
      
    } else {
      setKmlUrl('');
      setKmlVisible(false);
      if (!initialLocation) {
        setSelectedLocation(null);
      }
    }
  }, [selectedDistrict, selectedKhoroo, initialLocation]);

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedKhoroo(''); 
    
    const updatedInfo = {
      ...khorooInfo,
      district: district,
      khoroo: '' 
    };
    setKhorooInfo(updatedInfo);
    
    if (onKhorooInfoChange) {
      onKhorooInfoChange(updatedInfo);
    }
  };

  const handleKhorooChange = (e) => {
    const khoroo = e.target.value;
    setSelectedKhoroo(khoroo);
    
    const updatedInfo = {
      ...khorooInfo,
      khoroo: khoroo
    };
    setKhorooInfo(updatedInfo);
    
    if (onKhorooInfoChange) {
      onKhorooInfoChange(updatedInfo);
    }
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
        const khorooInfoData = {
          name: featureData.name,
          district: selectedDistrict.toLowerCase(),
          khoroo: selectedKhoroo || null 
        };
        
        if (selectedKhoroo) {
          khorooInfoData.khoroo = selectedKhoroo;
        } else {
          const match = featureData.name.match(/\d+/);
          if (match) {
            khorooInfoData.khoroo = match[0];
          }
        }
        
        setKhorooInfo(khorooInfoData);
        
        if (onKhorooInfoChange) {
          onKhorooInfoChange(khorooInfoData);
        }
      }
      
      if (event.latLng) {
        const newLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        
        setSelectedLocation(newLocation);
        
        if (onLocationChange) {
          onLocationChange(newLocation);
        }
      }
    }
  };

  const prepareSavedKhorooInfo = (locationName) => {
    if (!selectedDistrict) return null;
    
    let savedKhorooInfo = { ...khorooInfo } || {};
    const district = selectedDistrict.toLowerCase();
    let khoroo = selectedKhoroo;
    
    if (!khoroo && khorooInfo && khorooInfo.khoroo) {
      khoroo = khorooInfo.khoroo;
    }
    
    if (district && khoroo) {
      if (khoroo !== "All") {
        const khorooNumber = parseInt(khoroo, 10);
        const formattedKhoroo = khorooNumber < 10 ? `${khorooNumber}` : `${khorooNumber}`;
        
        savedKhorooInfo = {
          name: savedKhorooInfo.name || `${district.toUpperCase()}_${formattedKhoroo}`,
          district: district,
          khoroo: formattedKhoroo
        };
      } else {
        const match = locationName?.match(/\d+/);
        if (match) {
          const extractedKhoroo = match[0];
          savedKhorooInfo = {
            name: savedKhorooInfo.name || `${district.toUpperCase()}_${extractedKhoroo}`,
            district: district,
            khoroo: extractedKhoroo
          };
        } else {
          savedKhorooInfo = {
            name: savedKhorooInfo.name || `${district.toUpperCase()}`,
            district: district,
            khoroo: khoroo
          };
        }
      }
    }
    
    return savedKhorooInfo;
  };

  return {
    districtData,
    selectedDistrict,
    selectedKhoroo,
    khorooInfo,
    selectedLocation,
    kmlUrl,
    kmlLoading,
    kmlVisible,
    kmlKey,
    
    setSelectedLocation,
    handleDistrictChange,
    handleKhorooChange,
    handleKmlClick,
    generateKhorooOptions,
    prepareSavedKhorooInfo,
    
    // Utilities
    setKhorooInfo
  };
};

export default useDistrictKhoroo;
