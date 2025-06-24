import React, { useState, useEffect } from 'react';
import MapEdit from './MapEdit';

const ShonModal = ({ isOpen, onClose, sambar }) => {
  const [shons, setShons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newShonName, setNewShonName] = useState('');
  const [currentShon, setCurrentShon] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);  const [shonToDelete, setShonToDelete] = useState(null);
  const [activeShon, setActiveShon] = useState(null);

  // Initialize with a default shon at the sambar's position
  useEffect(() => {
    if (isOpen && sambar) {
      fetchShons();
      // Initialize with a default new shon position
      setCurrentShon({
        name: '',
        coordinates: {
          lat: sambar.coordinates.lat,
          lng: sambar.coordinates.lng
        },
        khorooInfo: {
          district: sambar.khorooInfo.district,
          khoroo: sambar.khorooInfo.khoroo,
          name: sambar.khorooInfo.name
        }
      });
    }
  }, [isOpen, sambar]);

  const fetchShons = async () => {
    if (!sambar) return;

    try {
      setLoading(true);
      setError('');
      
      // Fetch shons for this sambar's district and khoroo
      const response = await fetch(
        `http://localhost:3001/api/shon?district=${sambar.khorooInfo.district}&khoroo=${sambar.khorooInfo.khoroo}`
      );
      const data = await response.json();
      
      if (data.success) {
        setShons(data.data || []);
        if (data.data.length === 0) {
          setError('No shons found in this location');
        }
      } else {
        setError(data.message || 'Failed to load shons');
      }
    } catch (error) {
      console.error('Error fetching shons:', error);
      setError('Error loading shons. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateNewShon = async () => {
    if (!newShonName.trim()) {
      setError('Please enter a name for the new shon');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create a new shon near the sambar's location
      const newShon = {
        name: newShonName,
        coordinates: {
          lat: sambar.coordinates.lat,
          lng: sambar.coordinates.lng
        },
        khorooInfo: {
          district: sambar.khorooInfo.district,
          khoroo: sambar.khorooInfo.khoroo,
          name: sambar.khorooInfo.name
        }
      };

      // Set the current shon for editing directly in the visible map
      setCurrentShon(newShon);
      setIsAddingNew(true);
      setNewShonName('');
    } catch (error) {
      console.error('Error creating new shon:', error);
      setError('Error creating new shon. Please try again.');
      setLoading(false);
    }
  };

  const handleSaveNewShon = async (shon) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/shon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: shon.name,
          coordinates: shon.coordinates,
          khorooInfo: shon.khorooInfo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShons([...shons, data.data]);
        setError('');
        alert('Shon created successfully!');
      } else {
        setError(data.message || 'Failed to create shon');
      }
    } catch (error) {
      console.error('Error creating shon:', error);
      setError('Error creating shon. Please try again.');    } finally {
      setLoading(false);
      setCurrentShon(null);
      setIsAddingNew(false);
    }
  };  const handleEditShon = (shon) => {
    setCurrentShon(shon);
    setActiveShon(shon);
    setIsAddingNew(false);
  };
  const handleLocationChange = (newLocation) => {
    if (activeShon) {
      setActiveShon(prevShon => ({
        ...prevShon,
        coordinates: {
          lat: parseFloat(newLocation.lat),
          lng: parseFloat(newLocation.lng)
        }
      }));
    } else if (currentShon) {
      setCurrentShon(prevShon => ({
        ...prevShon,
        coordinates: {
          lat: parseFloat(newLocation.lat),
          lng: parseFloat(newLocation.lng)
        }
      }));
    }
  };
    const handleKhorooInfoChange = (newKhorooInfo) => {
    if (activeShon) {
      setActiveShon(prevShon => ({
        ...prevShon,
        khorooInfo: {
          ...newKhorooInfo,
          district: newKhorooInfo.district || prevShon.khorooInfo?.district,
          khoroo: newKhorooInfo.khoroo || prevShon.khorooInfo?.khoroo,
          name: newKhorooInfo.name || prevShon.khorooInfo?.name
        }
      }));
    } else if (currentShon) {
      setCurrentShon(prevShon => ({
        ...prevShon,
        khorooInfo: {
          ...newKhorooInfo,
          district: newKhorooInfo.district || prevShon.khorooInfo?.district,
          khoroo: newKhorooInfo.khoroo || prevShon.khorooInfo?.khoroo,
          name: newKhorooInfo.name || prevShon.khorooInfo?.name
        }
      }));
    }
  };
  const handleUpdateShon = async () => {
    if (!activeShon) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/shon/${activeShon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: activeShon.name,
          coordinates: activeShon.coordinates,
          khorooInfo: activeShon.khorooInfo
        })
      });      
      const data = await response.json();
      
      if (data.success) {
        setShons(shons.map(s => s._id === activeShon._id ? {...s, ...data.data} : s));
        setError('');
        alert('Shon updated successfully!');
        setActiveShon(null);
      } else {
        setError(data.message || 'Failed to update shon');
      }    } catch (error) {
      console.error('Error updating shon:', error);
      setError('Error updating shon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (shon) => {
    setShonToDelete(shon);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!shonToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/shon/${shonToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShons(shons.filter(s => s._id !== shonToDelete._id));
        setError('');
        alert('Shon deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete shon');
      }
    } catch (error) {
      console.error('Error deleting shon:', error);
      setError('Error deleting shon. Please try again.');
    } finally {
      setLoading(false);
      setIsConfirmDeleteOpen(false);
      setShonToDelete(null);
    }
  };
  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setShonToDelete(null);
  };
  const cancelEdit = () => {
    setActiveShon(null);
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay">
      <div className="map-modal-content" style={{ width: '90%', maxWidth: '1200px' }}>
        <div className="map-modal-header" style={{ backgroundColor: 'rgba(50, 205, 50, 0.1)' }}>
          <h3>
            <i className="fa fa-lightbulb" style={{ marginRight: '10px', color: '#32CD32' }}></i>
            Manage Shons for Sambar: {sambar?.name}
          </h3>
          <button 
            className="close-modal-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="map-modal-body" style={{ display: 'flex', flexDirection: 'row' }}>
          {/* Left Panel - Shon List and Form */}
          <div className="shon-list-panel" style={{ flex: '1', marginRight: '15px', overflowY: 'auto', maxHeight: '70vh' }}>
            <div className="add-new-shon-form">
              <div className="form-group">
                <label htmlFor="new-shon-name">Add New Shon:</label>
                <div className="search-input-group">
                  <input
                    id="new-shon-name"
                    type="text"
                    className="input-field"
                    value={newShonName}
                    onChange={(e) => setNewShonName(e.target.value)}
                    placeholder="Enter new shon name..."
                  />
                  <button 
                    type="button" 
                    className="add-button"
                    onClick={handleCreateNewShon}
                    disabled={loading || !newShonName.trim()}
                    style={{ 
                      backgroundColor: '#32CD32',
                      borderColor: '#28a745'
                    }}
                  >
                    Add New Shon
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <p className="error-message">{error}</p>
            )}
            
            {loading && (
              <p className="loading-message">Loading shons...</p>
            )}
            
            {shons.length > 0 && (
              <div>
                <h3>
                  Shons in {sambar?.khorooInfo?.district || 'District'} District, 
                  Khoroo {sambar?.khorooInfo?.khoroo || ''}
                </h3>
                <table className="user-list">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shons.map((shon) => (                      <tr key={shon._id} className={activeShon && activeShon._id === shon._id ? 'active-row' : ''}>
                        <td>{shon.name}</td>
                        <td className="user-actions">
                          <button 
                            className="edit-button"
                            onClick={() => handleEditShon(shon)}
                            style={{ 
                              backgroundColor: activeShon && activeShon._id === shon._id ? '#28a745' : '#32CD32',
                              borderColor: '#28a745'
                            }}
                          >
                            {activeShon && activeShon._id === shon._id ? 'Editing...' : 'Edit'}
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDelete(shon)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="map-modal-actions">
              <button 
                className="cancel-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
            {/* Right Panel - Map */}
          <div className="shon-map-panel" style={{ flex: '1.5', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div style={{ height: '100%', minHeight: '60vh', position: 'relative' }}>              <MapEdit
                initialLocation={sambar.coordinates}
                onLocationChange={handleLocationChange}
                sambar={activeShon || currentShon || sambar}
                onKhorooInfoChange={handleKhorooInfoChange}
                locationType="shon"
                allShons={shons}
                activeShonId={activeShon ? activeShon._id : null}
              />
              
              {/* Show edit controls only when a shon is selected */}
              {activeShon && (
                <div className="map-action-buttons" style={{ 
                  padding: '10px', 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px'
                }}>
                  <button 
                    className="cancel-button"
                    onClick={cancelEdit}
                    style={{ marginRight: '10px' }}
                  >
                    Cancel Edit
                  </button>
                  <button 
                    className="update-button"
                    onClick={handleUpdateShon}
                    style={{ 
                      backgroundColor: '#32CD32',
                      borderColor: '#28a745'
                    }}
                  >
                    Update Shon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && (
        <div className="confirm-delete-modal">
          <p>Are you sure you want to delete this shon?</p>
          <div className="confirm-delete-actions">
            <button onClick={confirmDelete} className="confirm-delete-button">
              Yes, delete
            </button>
            <button onClick={cancelDelete} className="cancel-delete-button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShonModal;
