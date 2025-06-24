import React, { useState, useEffect } from 'react';
import MapEdit from './MapEdit';

const LocationEditModal = ({ 
  isOpen, 
  sambar, 
  onClose, 
  onLocationChange, 
  onKhorooInfoChange, 
  onUpdate,
  locationType = 'sambar' 
}) => {
  const [localSambar, setLocalSambar] = useState(null);
  
  useEffect(() => {
    if (sambar) {
      setLocalSambar(sambar);
    }
  }, [sambar]);
  
  useEffect(() => {
    if (localSambar && sambar) {
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
    setLocalSambar({
      ...localSambar,
      coordinates: newLocation
    });
    
    onLocationChange(newLocation);
  };
  
  const handleLocalKhorooInfoChange = (newKhorooInfo) => {
    setLocalSambar({
      ...localSambar,
      khorooInfo: newKhorooInfo
    });
    
    onKhorooInfoChange(newKhorooInfo);
  };
    return (
    <div className="map-modal-overlay">
      <div className="map-modal-content">
        <div className="map-modal-header" style={{ 
          backgroundColor: locationType === 'shon' ? 'rgba(50, 205, 50, 0.1)' : 'rgba(255, 165, 0, 0.1)' 
        }}>
          <h3>
            <i className={`fa fa-${locationType === 'shon' ? 'lightbulb' : 'building'}`} 
               style={{ 
                 marginRight: '10px',
                 color: locationType === 'shon' ? '#32CD32' : '#FFA500'
               }}></i>
            Edit {locationType === 'shon' ? 'Shon' : 'Sambar'}: {localSambar.name}
          </h3>
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
            locationType={locationType}
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
              style={{ 
                backgroundColor: locationType === 'shon' ? '#32CD32' : '#FFA500',
                borderColor: locationType === 'shon' ? '#28a745' : '#e69500'
              }}
            >
              Update {locationType === 'shon' ? 'Shon' : 'Sambar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationEditModal;
