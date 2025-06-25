import React, { useState, useEffect } from 'react';
import MapEdit from './MapEdit';
import LineManagementPanel from './LineManagementPanel';
import useLineDrawing from '../hooks/useLineDrawing';

const LineModal = ({ isOpen, onClose, sambar }) => {
  // Shon state (needed for line drawing)
  const [shons, setShons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('');
      clearLineError();
    }
  }, [isOpen, sambar, fetchLines, clearLineError]);

  const fetchShons = async () => {
    if (!sambar) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/shon?sambarCode=${encodeURIComponent(sambar.name)}`);
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
      } else {
        setError(data.message || 'Failed to fetch shons');
      }
    } catch (error) {
      console.error('Error fetching shons:', error);
      setError('Error fetching shons');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (isDrawingLine) {
      cancelDrawing();
    }
    clearLineError();
    setError('');
    onClose();
  };

  const handleStartDrawingLine = () => {
    startDrawingLine(shons, sambar);
  };

  const handleSaveLine = () => {
    saveLine(shons);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Line Management - {sambar?.name}</h2>
          <button className="close-button" onClick={handleCloseModal}>×</button>
        </div>

        <div className="modal-body">
          {(error || lineError) && (
            <div className="error-message">
              {error || lineError}
            </div>
          )}

          <div className="line-modal-layout">
            {/* Left side - Line Management Panel */}
            <div className="line-management-section">
              <h3>Line Management</h3>
              <LineManagementPanel
                lines={lines}
                shons={shons}
                selectedShons={selectedShons}
                isDrawingLine={isDrawingLine}
                currentLine={currentLine}
                lineLoading={lineLoading}
                onShonSelect={toggleShonSelection}
                onStartDrawingLine={handleStartDrawingLine}
                onSaveLine={handleSaveLine}
                onCancelDrawing={cancelDrawing}
                onDeleteLine={deleteLine}
              />
            </div>

            {/* Right side - Map */}
            <div className="map-section">
              <h3>Map View</h3>
              {isDrawingLine && (
                <div style={{ 
                  backgroundColor: '#ffe6e6', 
                  padding: '10px', 
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ff9999'
                }}>
                  <strong>Click on the map to add inflection points.</strong>
                  {currentLine && (
                    <div>Points added: {currentLine.coordinates?.length || 0}</div>
                  )}
                </div>
              )}
              <div className="map-container">
                <MapEdit
                  sambar={sambar}
                  allShons={shons}
                  onShonUpdate={fetchShons}
                  onLocationChange={() => {}} // Empty function during line drawing
                  onKhorooInfoChange={() => {}} // Empty function during line drawing
                  
                  // Line drawing props
                  lines={lines}
                  currentLine={currentLine}
                  isDrawingLine={isDrawingLine}
                  selectedShons={selectedShons}
                  onLineClick={addInflectionPoint}
                  onShonSelect={toggleShonSelection}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineModal;
