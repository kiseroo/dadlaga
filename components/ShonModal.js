import React, { useState, useEffect } from 'react';
import MapEdit from './MapEdit';
import LineManagementPanel from './LineManagementPanel';
import useLineDrawing from '../hooks/useLineDrawing';

const ShonModal = ({ isOpen, onClose, sambar }) => {
  // Shon-related state
  const [shons, setShons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newShonName, setNewShonName] = useState('');
  const [currentShon, setCurrentShon] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [shonToDelete, setShonToDelete] = useState(null);
  const [activeShon, setActiveShon] = useState(null);

  // Line drawing hook
  const {
    lines,
    currentLine,
    isDrawingLine,
    selectedShons,
    loading: lineLoading,
    error: lineError,
    fetchLines,
    startDrawingLine,
    addInflectionPoint,
    saveLine,
    cancelDrawing,
    toggleShonSelection,
    deleteLine,
    clearError: clearLineError
  } = useLineDrawing();

  useEffect(() => {
    if (isOpen && sambar) {
      fetchShons();
      fetchLines(sambar.name);
      setCurrentShon(null);
      setActiveShon(null);
      setIsAddingNew(false);
      setError('');
      clearLineError();
    }
  }, [isOpen, sambar, fetchLines, clearLineError]);

  const fetchShons = async () => {
    if (!sambar) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `http://localhost:3001/api/shon?sambarCode=${encodeURIComponent(sambar.name)}`
      );
      const data = await response.json();
      
      if (data.success) {
        const transformedShons = (data.data || []).map(shon => ({
          ...shon,
          coordinates: shon.location ? {
            lat: shon.location.lat,
            lng: shon.location.lng
          } : (shon.coordinates || { lat: 0, lng: 0 })
        }));
        setShons(transformedShons);
        setError('');
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
      
      const newShon = {
        name: newShonName.trim(),
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

      await handleSaveNewShon(newShon);
      setNewShonName('');
    } catch (error) {
      console.error('Error creating new shon:', error);
      setError('Error creating new shon. Please try again.');
      setLoading(false);
    }
  };

  const handleSaveNewShon = async (shon) => {
    if (!shon.name.trim()) {
      setError('Please enter a name for the shon');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const requestData = {
        sambarCode: sambar.name, 
        code: shon.name.trim(), 
        location: { 
          lat: Number(shon.coordinates.lat),
          lng: Number(shon.coordinates.lng)
        }
      };
      
      console.log("Sending shon data to backend:", requestData);
      
      const response = await fetch('http://localhost:3001/api/shon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newShonData = {
          ...data.data,
          coordinates: {
            lat: data.data.location?.lat || 0,
            lng: data.data.location?.lng || 0
          }
        };
        setShons([...shons, newShonData]);
        setError('');
        alert('Shon created successfully!');
      } else {
        setError(data.message || 'Failed to create shon');
      }
    } catch (error) {
      console.error('Error creating shon:', error);
      setError('Error creating shon. Please try again.');
    } finally {
      setLoading(false);
      setCurrentShon(null);
      setIsAddingNew(false);
    }
  };  const handleEditShon = (shon) => {
    
    const shonName = shon.code || shon.name || '';
    const shonCoordinates = shon.location || shon.coordinates || { lat: 0, lng: 0 };
    
    setActiveShon({
      ...shon,
      name: shonName, 
      coordinates: {
        lat: parseFloat(shonCoordinates.lat),
        lng: parseFloat(shonCoordinates.lng)
      },
      khorooInfo: shon.khorooInfo ? { ...shon.khorooInfo } : {
        district: sambar.khorooInfo.district,
        khoroo: sambar.khorooInfo.khoroo,
        name: sambar.khorooInfo.name
      }
    });
    setCurrentShon({
      ...shon,
      name: shonName,
      coordinates: {
        lat: parseFloat(shonCoordinates.lat),
        lng: parseFloat(shonCoordinates.lng)
      },
      khorooInfo: shon.khorooInfo ? { ...shon.khorooInfo } : {
        district: sambar.khorooInfo.district,
        khoroo: sambar.khorooInfo.khoroo,
        name: sambar.khorooInfo.name
      }
    });
    setIsAddingNew(false);
    setError('');
  };
  const handleLocationChange = (newLocation) => {
    console.log("Location changed:", newLocation);
    
    // If we're drawing a line, add the point to the line
    if (isDrawingLine) {
      handleLineClick(newLocation);
      return;
    }
    
    if (activeShon) {
      const updatedCoordinates = {
        lat: parseFloat(newLocation.lat),
        lng: parseFloat(newLocation.lng)
      };
      
      setActiveShon(prevShon => ({
        ...prevShon,
        coordinates: updatedCoordinates,
        location: updatedCoordinates
      }));
      
      setCurrentShon(prevShon => ({
        ...prevShon,
        coordinates: updatedCoordinates,
        location: updatedCoordinates
      }));
    } else if (currentShon) {
      const updatedCoordinates = {
        lat: parseFloat(newLocation.lat),
        lng: parseFloat(newLocation.lng)
      };
      
      setCurrentShon(prevShon => ({
        ...prevShon,
        coordinates: updatedCoordinates,
        location: updatedCoordinates
      }));
    } else {
      setCurrentShon({
        name: '',
        coordinates: {
          lat: parseFloat(newLocation.lat),
          lng: parseFloat(newLocation.lng)
        },
        location: {
          lat: parseFloat(newLocation.lat),
          lng: parseFloat(newLocation.lng)
        },
        khorooInfo: {
          district: sambar.khorooInfo.district,
          khoroo: sambar.khorooInfo.khoroo,
          name: sambar.khorooInfo.name
        }
      });
      setIsAddingNew(true);
    }
  };
  const handleKhorooInfoChange = (newKhorooInfo) => {
    console.log("Khoroo info changed:", newKhorooInfo);
    
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
      setCurrentShon(prevShon => ({
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
    
    if (!activeShon.name.trim()) {
      setError('Please enter a name for the shon');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const updateData = {
        sambarCode: sambar.name, 
        code: activeShon.name.trim(), 
        location: { 
          lat: Number(activeShon.coordinates.lat),
          lng: Number(activeShon.coordinates.lng)
        }
      };
      
      console.log("Updating shon with data:", updateData);
      
      const response = await fetch(`http://localhost:3001/api/shon/${activeShon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });      
      const data = await response.json();
      
      if (data.success) {
        setError('');
        setActiveShon(null);
        setCurrentShon(null);
        
        await fetchShons();
        
        alert('Shon updated successfully!');
      } else {
        setError(data.message || 'Failed to update shon');
      }
    } catch (error) {
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
    setCurrentShon(null);
    setError('');
  };

  const handleShonNameChange = (e) => {
    const newName = e.target.value;
    
    if (activeShon) {
      setActiveShon(prevShon => ({
        ...prevShon,
        name: newName
      }));
      setCurrentShon(prevShon => ({
        ...prevShon,
        name: newName
      }));
    }
  };

  // Line drawing handlers using the hook
  const handleStartDrawingLine = () => {
    const success = startDrawingLine(shons, sambar);
    if (!success && lineError) {
      setError(lineError);
    }
  };

  const handleLineClick = (coordinates) => {
    addInflectionPoint(coordinates);
  };

  const handleSaveLine = async () => {
    const success = await saveLine(shons);
    if (success) {
      alert('Line saved successfully!');
    } else if (lineError) {
      setError(lineError);
    }
  };

  const handleCancelDrawing = () => {
    cancelDrawing();
  };

  const handleShonSelect = (shonId) => {
    toggleShonSelection(shonId);
  };

  const handleDeleteLine = async (lineId) => {
    const success = await deleteLine(lineId);
    if (success) {
      alert('Line deleted successfully!');
    } else if (lineError) {
      setError(lineError);
    }
  };

  // Clear errors from both sources
  const clearAllErrors = () => {
    setError('');
    clearLineError();
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
                    disabled={loading || lineLoading || !newShonName.trim()}
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
            
            {(error || lineError) && (
              <p className="error-message">{error || lineError}</p>
            )}
            
            {(loading || lineLoading) && (
              <p className="loading-message">
                {loading ? 'Loading shons...' : 'Processing lines...'}
              </p>
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
                        <td>{shon.code || shon.name}</td>
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
            
            {/* Line Management Section */}
            <LineManagementPanel
              shons={shons}
              lines={lines}
              selectedShons={selectedShons}
              isDrawingLine={isDrawingLine}
              currentLine={currentLine}
              lineLoading={lineLoading}
              onShonSelect={handleShonSelect}
              onStartDrawingLine={handleStartDrawingLine}
              onSaveLine={handleSaveLine}
              onCancelDrawing={handleCancelDrawing}
              onDeleteLine={handleDeleteLine}
            />

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
                key={`map-${shons.length}-${activeShon ? activeShon._id : 'none'}-${lines.length}`}
                initialLocation={
                  activeShon ? activeShon.coordinates : 
                  currentShon ? currentShon.coordinates : 
                  sambar.coordinates
                }
                onLocationChange={handleLocationChange}
                sambar={activeShon ? {
                  ...activeShon,
                  // Ensure coordinates are available for the map
                  coordinates: activeShon.coordinates || activeShon.location || sambar.coordinates
                } : currentShon || sambar}
                onKhorooInfoChange={handleKhorooInfoChange}
                locationType="shon"
                allShons={shons}
                activeShonId={activeShon ? activeShon._id : null}
                onLineClick={isDrawingLine ? handleLineClick : null}
                lines={lines}
                currentLine={currentLine}
                isDrawingLine={isDrawingLine}
                selectedShons={selectedShons}
                onShonSelect={handleShonSelect}
              />
              
              {/* Show save button when adding new shon by clicking map */}
              {isAddingNew && currentShon && !activeShon && (
                <div className="map-action-buttons" style={{ 
                  padding: '10px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minWidth: '200px'
                }}>
                  <div className="add-shon-form" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                      New Shon Name:
                    </label>
                    <input
                      type="text"
                      value={currentShon.name || ''}
                      onChange={(e) => setCurrentShon(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter shon name..."
                      style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '12px',
                        marginBottom: '10px'
                      }}
                    />
                    <p style={{ fontSize: '10px', color: '#666', margin: '0 0 10px 0' }}>
                      Coordinates: {currentShon.coordinates?.lat?.toFixed(6)}, {currentShon.coordinates?.lng?.toFixed(6)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="cancel-button"
                      onClick={() => {
                        setCurrentShon(null);
                        setIsAddingNew(false);
                      }}
                      style={{ marginRight: '10px', fontSize: '12px', padding: '5px 10px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="add-button"
                      onClick={() => handleSaveNewShon(currentShon)}
                      disabled={loading || lineLoading || !currentShon.name?.trim()}
                      style={{ 
                        backgroundColor: '#32CD32',
                        borderColor: '#28a745',
                        fontSize: '12px',
                        padding: '5px 10px'
                      }}
                    >
                      {(loading || lineLoading) ? 'Saving...' : 'Save Shon'}
                    </button>
                  </div>
                </div>
              )}

              {/* Show edit controls only when a shon is selected */}
              {activeShon && (
                <div className="map-action-buttons" style={{ 
                  padding: '10px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minWidth: '200px'
                }}>
                  <div className="edit-shon-form" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                      Edit Shon Name:
                    </label>
                    <input
                      type="text"
                      value={activeShon.name || ''}
                      onChange={handleShonNameChange}
                      placeholder="Enter shon name..."
                      style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '12px',
                        marginBottom: '10px'
                      }}
                    />
                    <p style={{ fontSize: '10px', color: '#666', margin: '0 0 10px 0' }}>
                      Position: {activeShon.coordinates?.lat?.toFixed(6)}, {activeShon.coordinates?.lng?.toFixed(6)}
                    </p>
                    <p style={{ fontSize: '10px', color: '#888', margin: '0 0 10px 0', fontStyle: 'italic' }}>
                      Drag the marker on the map to change location
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="cancel-button"
                      onClick={cancelEdit}
                      style={{ marginRight: '10px', fontSize: '12px', padding: '5px 10px' }}
                    >
                      Cancel Edit
                    </button>
                    <button 
                      className="update-button"
                      onClick={handleUpdateShon}
                      disabled={loading || lineLoading || !activeShon.name.trim()}
                      style={{ 
                        backgroundColor: '#32CD32',
                        borderColor: '#28a745',
                        fontSize: '12px',
                        padding: '5px 10px'
                      }}
                    >
                      {(loading || lineLoading) ? 'Updating...' : 'Update Shon'}
                    </button>
                  </div>
                </div>
              )}

              {/* Line Drawing Controls */}
              {isDrawingLine && currentLine && (
                <div className="line-drawing-controls" style={{ 
                  padding: '10px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minWidth: '200px'
                }}>
                  <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                    Drawing line between selected shons. Click on the map to add points.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button 
                      className="cancel-button"
                      onClick={handleCancelDrawing}
                      style={{ 
                        fontSize: '12px', 
                        padding: '5px 10px',
                        marginRight: '10px'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-button"
                      onClick={handleSaveLine}
                      disabled={loading || lineLoading}
                      style={{ 
                        backgroundColor: '#32CD32',
                        borderColor: '#28a745',
                        fontSize: '12px',
                        padding: '5px 10px'
                      }}
                    >
                      {(loading || lineLoading) ? 'Saving...' : 'Save Line'}
                    </button>
                  </div>
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
