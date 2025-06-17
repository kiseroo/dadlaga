import React, { useState, useEffect } from 'react';
import MapEdit from './MapEdit';

const LocationEditModal = ({ 
  isOpen, 
  sambar, 
  onClose, 
  onLocationChange, 
  onKhorooInfoChange, 
  onUpdate 
}) => {
  const [localSambar, setLocalSambar] = useState(null);
  
  useEffect(() => {
    if (sambar) {
      setLocalSambar(sambar);
    }
  }, [sambar]);
  
  // Track changes to the sambar through our callback handlers
  useEffect(() => {
    if (localSambar && sambar) {
      // If coordinates or khorooInfo has been updated, ensure our local state reflects this
      if (
        localSambar.coordinates?.lat !== sambar.coordinates?.lat ||
        localSambar.coordinates?.lng !== sambar.coordinates?.lng ||
        JSON.stringify(localSambar.khorooInfo) !== JSON.stringify(sambar.khorooInfo)
      ) {
        setLocalSambar(sambar);
      }
    }
  }, [sambar]);

  if (!isOpen || !localSambar) return null;
  
  const handleLocalLocationChange = (newLocation) => {
    // Update our local state
    setLocalSambar({
      ...localSambar,
      coordinates: newLocation
    });
    
    // Call the parent's handler
    onLocationChange(newLocation);
  };
  
  const handleLocalKhorooInfoChange = (newKhorooInfo) => {
    // Update our local state
    setLocalSambar({
      ...localSambar,
      khorooInfo: newKhorooInfo
    });
    
    // Call the parent's handler
    onKhorooInfoChange(newKhorooInfo);
  };
  
  return (
    <div className="map-modal-overlay">
      <div className="map-modal-content">
        <div className="map-modal-header">
          <h3>Edit Location: {localSambar.name}</h3>
          <button 
            className="close-modal-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="map-modal-body">
          <MapEdit
            initialLocation={localSambar.coordinates}
            onLocationChange={handleLocalLocationChange}
            sambar={localSambar}
            onKhorooInfoChange={handleLocalKhorooInfoChange}
          />
          <div className="map-modal-actions">
            <button 
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="update-button"
              onClick={() => onUpdate(localSambar)}
            >
              Update Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationEditModal;
