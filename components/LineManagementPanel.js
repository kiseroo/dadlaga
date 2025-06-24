import React from 'react';

const LineManagementPanel = ({
  shons,
  lines,
  selectedShons,
  isDrawingLine,
  currentLine,
  lineLoading,
  onShonSelect,
  onStartDrawingLine,
  onSaveLine,
  onCancelDrawing,
  onDeleteLine
}) => {
  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
        <i className="fa fa-connectdevelop" style={{ marginRight: '8px', color: '#007bff' }}></i>
        Connection Lines
      </h3>
      
      {/* Shon Selection for Line Drawing */}
      {!isDrawingLine && (
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>
            Select 2 shons to connect:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
            {shons.map((shon) => (
              <button
                key={shon._id}
                onClick={() => onShonSelect(shon._id)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  backgroundColor: selectedShons.includes(shon._id) ? '#007bff' : '#f8f9fa',
                  color: selectedShons.includes(shon._id) ? 'white' : '#333',
                  cursor: 'pointer'
                }}
              >
                {shon.code || shon.name}
              </button>
            ))}
          </div>
          <button
            onClick={onStartDrawingLine}
            disabled={selectedShons.length !== 2}
            style={{
              padding: '8px 15px',
              backgroundColor: selectedShons.length === 2 ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedShons.length === 2 ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Start Drawing Line
          </button>
        </div>
      )}

      {/* Line Drawing Controls */}
      {isDrawingLine && (
        <div style={{ 
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0056b3' }}>
            Drawing Line Mode
          </p>
          <p style={{ fontSize: '12px', margin: '0 0 10px 0' }}>
            Click on the map to add inflection points for the line.
          </p>
          {currentLine && (
            <p style={{ fontSize: '12px', margin: '0 0 15px 0' }}>
              Points added: {currentLine.coordinates.length}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSaveLine}
              disabled={!currentLine || currentLine.coordinates.length === 0 || lineLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {lineLoading ? 'Saving...' : 'Save Line'}
            </button>
            <button
              onClick={onCancelDrawing}
              disabled={lineLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Lines List */}
      {lines.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Existing Lines:</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {lines.map((line, index) => {
              const startShon = shons.find(s => s._id === line.startShonId);
              const endShon = shons.find(s => s._id === line.endShonId);
              return (
                <div
                  key={line._id || index}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    marginBottom: '5px',
                    backgroundColor: '#f8f9fa',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ marginBottom: '5px' }}>
                    <strong>
                      {startShon?.code || startShon?.name || 'Unknown'} → {endShon?.code || endShon?.name || 'Unknown'}
                    </strong>
                  </div>
                  <div style={{ color: '#666', marginBottom: '5px' }}>
                    Points: {line.coordinates?.length || 0}
                    {line.stats && (
                      <span style={{ marginLeft: '10px' }}>
                        Distance: {line.stats.totalDistanceKm?.toFixed(2)}km
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteLine(line._id)}
                    disabled={lineLoading}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    {lineLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineManagementPanel;
