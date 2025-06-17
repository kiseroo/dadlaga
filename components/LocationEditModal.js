import React from 'react';
import MapEdit from './MapEdit';

const LocationEditModal = ({ 
  isOpen, 
  sambar, 
  onClose, 
  onLocationChange, 
  onKhorooInfoChange, 
  onUpdate 
}) => {
  if (!isOpen || !sambar) return null;
  
  return (
    <div className="map-modal-overlay">
      <div className="map-modal-content">
        <div className="map-modal-header">
          <h3>Edit Location: {sambar.name}</h3>
          <button 
            className="close-modal-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="map-modal-body">
          <MapEdit
            initialLocation={sambar.coordinates}
            onLocationChange={onLocationChange}
            sambar={sambar}
            onKhorooInfoChange={onKhorooInfoChange}
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
              onClick={() => onUpdate(sambar)}
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
