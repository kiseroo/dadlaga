import { useState, useCallback } from 'react';

const useLineDrawing = () => {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [selectedShons, setSelectedShons] = useState([]);
  const [selectedSambarId, setSelectedSambarId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLines = useCallback(async (sambarCode) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/lines?sambarCode=${encodeURIComponent(sambarCode)}`);
      const data = await response.json();
      
      if (data.success) {
        setLines(data.data);
      } else {
        setError(data.message || 'Failed to fetch lines');
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
      setError('Error fetching lines');
    } finally {
      setLoading(false);
    }
  }, []);

  // drawing a line between selected shons or between shon and sambar
  const startDrawingLine = useCallback((shons, sambar) => {
    // Clear any existing sambar selection
    setSelectedSambarId(null);
    
    if (selectedShons.length < 1) {
      setError('Please select at least 1 shon to start drawing a line');
      return false;
    }
    
    const startShon = shons.find(s => s._id === selectedShons[0]);
    
    if (!startShon) {
      setError('Selected shon not found');
      return false;
    }
    
    const startCoords = startShon.coordinates || startShon.location;
    
    setIsDrawingLine(true);
    
    // If two shons are selected, set the second as endpoint
    if (selectedShons.length === 2) {
      const endShon = shons.find(s => s._id === selectedShons[1]);
      
      if (endShon) {
        setCurrentLine({
          startShonId: selectedShons[0],
          endShonId: selectedShons[1],
          coordinates: [
            { lat: startCoords.lat, lng: startCoords.lng }
          ],
          sambarCode: sambar.name
        });
      }
    } else {
      // If only one shon is selected, leave endpoint open (can be set to another shon or sambar)
      setCurrentLine({
        startShonId: selectedShons[0],
        // No endpoint set yet
        coordinates: [
          { lat: startCoords.lat, lng: startCoords.lng }
        ],
        sambarCode: sambar.name
      });
    }
    
    setError('Click on the map to add inflection points, or click on a shon or sambar to connect to it.');
    return true;
  }, [selectedShons]);

  const addInflectionPoint = useCallback((coordinates) => {
    if (!isDrawingLine || !currentLine) {
      console.log('Cannot add inflection point - not in drawing mode');
      return;
    }
    
    console.log('Adding inflection point at:', coordinates);
    
    setCurrentLine(prev => {
      const newCoordinates = [...prev.coordinates, { lat: coordinates.lat, lng: coordinates.lng }];
      const newLine = {
        ...prev,
        coordinates: newCoordinates
      };
      console.log('Line updated with', newCoordinates.length, 'points');
      return newLine;
    });
  }, [isDrawingLine, currentLine]);

  // Toggle selection of a sambar for line drawing
  const toggleSambarSelection = useCallback((sambarId) => {
    if (!isDrawingLine || !currentLine) {
      console.log('Cannot select sambar - not in drawing mode');
      return;
    }
    
    console.log('Toggling sambar selection:', sambarId);
    
    // If we already have a shon as endpoint, replace it with the sambar
    // But since the backend requires endShonId, we need to keep the startShonId as endShonId as well
    setCurrentLine(prev => ({
      ...prev,
      endShonId: prev.startShonId, // Keep the startShonId as endShonId (backend requirement)
      endSambarId: sambarId // Set sambar as endpoint
    }));
    
    setSelectedSambarId(sambarId);
  }, [isDrawingLine, currentLine]);

  const saveLine = useCallback(async (shons, sambar) => {
    if (!currentLine) {
      setError('No line to save');
      return false;
    }

    try {
      setLoading(true);
      
      // Determine the endpoint coordinates based on whether it's a shon or sambar
      let endCoords;
      
      const isEndingSambar = currentLine.endSambarId && sambar && sambar._id === currentLine.endSambarId;
      
      if (isEndingSambar) {
        // End point is a sambar
        endCoords = sambar.coordinates;
      } else if (currentLine.endShonId) {
        // End point is a shon
        const endShon = shons.find(s => s._id === currentLine.endShonId);
        if (!endShon) {
          setError('End shon not found');
          return false;
        }
        endCoords = endShon.coordinates || endShon.location;
      } else {
        setError('No endpoint selected (shon or sambar)');
        return false;
      }
      
      if (!endCoords || !endCoords.lat || !endCoords.lng) {
        setError('Invalid endpoint coordinates');
        return false;
      }
      
      const completeCoordinates = [
        ...currentLine.coordinates,
        { lat: endCoords.lat, lng: endCoords.lng }
      ];
      
      // Prepare the line data
      // If the endpoint is a sambar, we use the startShonId as endShonId to satisfy the backend validation
      // but we also include endSambarId to know it's actually a sambar endpoint
      const lineData = {
        sambarCode: currentLine.sambarCode,
        startShonId: currentLine.startShonId,
        startSambarId: currentLine.startSambarId,
        endShonId: currentLine.endShonId, // This will be the same as startShonId if endpoint is a sambar
        endSambarId: isEndingSambar ? currentLine.endSambarId : undefined,
        coordinates: completeCoordinates
      };

      const response = await fetch('http://localhost:3001/api/lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lineData)
      });

      const data = await response.json();

      if (data.success) {
        setLines(prev => [...prev, data.data]);
        setCurrentLine(null);
        setIsDrawingLine(false);
        setSelectedShons([]);
        setSelectedSambarId(null);
        setError('');
        return true;
      } else {
        setError(data.message || 'Failed to save line');
        return false;
      }
    } catch (error) {
      console.error('Error saving line:', error);
      setError('Error saving line. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentLine]);

  const cancelDrawing = useCallback(() => {
    setCurrentLine(null);
    setIsDrawingLine(false);
    setSelectedShons([]);
    setSelectedSambarId(null);
    setError('');
  }, []);

  const toggleShonSelection = useCallback((shonId) => {
    if (isDrawingLine) {
      // In drawing mode, clicking a shon sets it as the endpoint
      setCurrentLine(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          endSambarId: undefined, // Remove sambar endpoint if exists
          endShonId: shonId // Set this shon as endpoint
        };
      });
      return;
    }
    
    // Normal selection mode (before drawing)
    setSelectedShons(prev => {
      if (prev.includes(shonId)) {
        return prev.filter(id => id !== shonId);
      } else if (prev.length < 2) {
        return [...prev, shonId];
      } else {
        return [prev[1], shonId];
      }
    });
  }, [isDrawingLine, currentLine]);

  // Delete a line
  const deleteLine = useCallback(async (lineId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/lines/${lineId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setLines(prev => prev.filter(line => line._id !== lineId));
        return true;
      } else {
        setError(data.message || 'Failed to delete line');
        return false;
      }
    } catch (error) {
      console.error('Error deleting line:', error);
      setError('Error deleting line. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const simplifyLine = useCallback(async (lineId, tolerance = 10) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/lines/${lineId}/simplify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tolerance })
      });

      const data = await response.json();

      if (data.success) {
        setLines(prev => prev.map(line => 
          line._id === lineId ? data.data : line
        ));
        return data.data;
      } else {
        setError(data.message || 'Failed to simplify line');
        return null;
      }
    } catch (error) {
      console.error('Error simplifying line:', error);
      setError('Error simplifying line. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLinesForShon = useCallback(async (shonId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/lines/shon/${shonId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        setError(data.message || 'Failed to fetch lines for shon');
        return [];
      }
    } catch (error) {
      console.error('Error fetching lines for shon:', error);
      setError('Error fetching lines for shon');
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const reset = useCallback(() => {
    setLines([]);
    setCurrentLine(null);
    setIsDrawingLine(false);
    setSelectedShons([]);
    setSelectedSambarId(null);
    setError('');
    setLoading(false);
  }, []);

  return {
    lines,
    currentLine,
    isDrawingLine,
    selectedShons,
    selectedSambarId,
    loading,
    error,
    
    fetchLines,
    startDrawingLine,
    addInflectionPoint,
    saveLine,
    cancelDrawing,
    toggleShonSelection,
    toggleSambarSelection,
    deleteLine,
    simplifyLine,
    getLinesForShon,
    clearError,
    reset
  };
};

export default useLineDrawing;
