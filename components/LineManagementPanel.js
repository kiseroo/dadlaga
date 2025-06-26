import React from 'react';

const LineManagementPanel = ({
  shons,
  lines,
  sambar,
  selectedShons,
  selectedSambarId,
  isDrawingLine,
  currentLine,
  lineLoading,
  onShonSelect,
  onSambarSelect,
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
            Select at least 1 shon to start drawing a line:
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
          
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', margin: '0 0 5px 0', color: '#555' }}>
              You can connect:
            </p>
            <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: '0' }}>
              <li>Shon to Shon</li>
              <li>Shon to Sambar</li>
            </ul>
          </div>
          
          <button
            onClick={onStartDrawingLine}
            disabled={selectedShons.length < 1}
            style={{
              padding: '8px 15px',
              backgroundColor: selectedShons.length >= 1 ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedShons.length >= 1 ? 'pointer' : 'not-allowed',
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
          
          <div style={{ 
            padding: '8px', 
            backgroundColor: '#f0f8ff', 
            borderRadius: '4px', 
            marginBottom: '10px',
            border: '1px dashed #b3d7ff'
          }}>
            <p style={{ fontSize: '12px', margin: '0 0 5px 0', fontWeight: 'bold' }}>
              Connect to:
            </p>
            
            {/* Shon connection options */}
            <div style={{ marginBottom: '5px' }}>
              <p style={{ fontSize: '12px', margin: '0 0 5px 0' }}>Shons:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {shons.map((shon) => (
                  <button
                    key={`drawing-${shon._id}`}
                    onClick={() => onShonSelect(shon._id)}
                    disabled={currentLine?.startShonId === shon._id}
                    style={{
                      padding: '3px 6px',
                      fontSize: '11px',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      backgroundColor: currentLine?.endShonId === shon._id ? '#28a745' : '#f8f9fa',
                      color: currentLine?.endShonId === shon._id ? 'white' : '#333',
                      cursor: currentLine?.startShonId === shon._id ? 'not-allowed' : 'pointer',
                      opacity: currentLine?.startShonId === shon._id ? 0.5 : 1
                    }}
                  >
                    {shon.code || shon.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sambar connection option */}
            <div>
              <p style={{ fontSize: '12px', margin: '5px 0' }}>Sambar:</p>
              <button
                onClick={() => onSambarSelect(sambar._id)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  border: '1px solid #ffa500',
                  borderRadius: '3px',
                  backgroundColor: selectedSambarId === sambar._id ? '#ffa500' : '#fff9e6',
                  color: selectedSambarId === sambar._id ? 'white' : '#996300',
                  cursor: 'pointer'
                }}
              >
                {sambar.name || 'This Sambar'}
              </button>
            </div>
          </div>
          
          <p style={{ fontSize: '12px', margin: '0 0 5px 0' }}>
            Click on the map to add inflection points for the line.
          </p>
          
          {currentLine && (
            <div style={{ fontSize: '12px', margin: '0 0 15px 0' }}>
              <p style={{ margin: '0 0 3px 0' }}>
                <strong>From:</strong> {currentLine.startShonId ? 
                  (shons.find(s => s._id === currentLine.startShonId)?.code || 'Shon') : 
                  (currentLine.startSambarId ? 'Sambar' : 'Unknown')}
              </p>
              <p style={{ margin: '0 0 3px 0' }}>
                <strong>To:</strong> {currentLine.endSambarId && selectedSambarId ? 
                  'Sambar' : 
                  (currentLine.endShonId ? 
                    (shons.find(s => s._id === currentLine.endShonId)?.code || 'Shon') : 
                    'Not selected yet')}
              </p>
              <p style={{ margin: '0' }}>
                <strong>Points:</strong> {currentLine.coordinates.length}
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSaveLine}
              disabled={!currentLine || currentLine.coordinates.length === 0 || 
                        lineLoading || (!currentLine?.endShonId && !selectedSambarId)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: (!currentLine || !currentLine.coordinates?.length || 
                         (!currentLine?.endShonId && !selectedSambarId)) ? 0.6 : 1
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
              // Determine start and end points (can be shon or sambar)
              let startInfo = "Unknown";
              let endInfo = "Unknown";
              
              // Check for shon endpoints
              const startShon = shons.find(s => s._id === line.startShonId);
              const endShon = shons.find(s => s._id === line.endShonId);
              
              // Check for sambar endpoints
              if (line.startSambarId && sambar && sambar._id === line.startSambarId) {
                startInfo = `Sambar: ${sambar.name || 'Current Sambar'}`;
              } else if (startShon) {
                startInfo = `Shon: ${startShon.code || startShon.name || 'Unknown'}`;
              }
              
              if (line.endSambarId && sambar && sambar._id === line.endSambarId) {
                endInfo = `Sambar: ${sambar.name || 'Current Sambar'}`;
              } else if (endShon) {
                endInfo = `Shon: ${endShon.code || endShon.name || 'Unknown'}`;
              }
              
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
                      {startInfo} → {endInfo}
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
