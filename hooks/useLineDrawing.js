import { useState, useCallback } from 'react';

/**
 * Custom hook for managing line drawing operations
 */
const useLineDrawing = () => {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [selectedShons, setSelectedShons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch lines for a sambar
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

  // Start drawing a line between selected shons
  const startDrawingLine = useCallback((shons, sambar) => {
    if (selectedShons.length < 2) {
      setError('Please select at least 2 shons to connect with a line');
      return false;
    }
    
    const startShon = shons.find(s => s._id === selectedShons[0]);
    const endShon = shons.find(s => s._id === selectedShons[1]);
    
    if (!startShon || !endShon) {
      setError('Selected shons not found');
      return false;
    }
    
    const startCoords = startShon.coordinates || startShon.location;
    
    setIsDrawingLine(true);
    setCurrentLine({
      startShonId: selectedShons[0],
      endShonId: selectedShons[1],
      coordinates: [
        { lat: startCoords.lat, lng: startCoords.lng }
      ],
      sambarCode: sambar.name
    });
    setError('Click on the map to add inflection points.');
    return true;
  }, [selectedShons]);

  // Add inflection point to current line
  const addInflectionPoint = useCallback((coordinates) => {
    if (!isDrawingLine || !currentLine) return;
    
    setCurrentLine(prev => ({
      ...prev,
      coordinates: [...prev.coordinates, { lat: coordinates.lat, lng: coordinates.lng }]
    }));
  }, [isDrawingLine, currentLine]);

  // Save the current line
  const saveLine = useCallback(async (shons) => {
    if (!currentLine) {
      setError('No line to save');
      return false;
    }

    try {
      setLoading(true);
      
      const endShon = shons.find(s => s._id === currentLine.endShonId);
      if (!endShon) {
        setError('End shon not found');
        return false;
      }
      
      const endCoords = endShon.coordinates || endShon.location;
      
      const completeCoordinates = [
        ...currentLine.coordinates,
        { lat: endCoords.lat, lng: endCoords.lng }
      ];
      
      const lineData = {
        sambarCode: currentLine.sambarCode,
        startShonId: currentLine.startShonId,
        endShonId: currentLine.endShonId,
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

  // Cancel line drawing
  const cancelDrawing = useCallback(() => {
    setCurrentLine(null);
    setIsDrawingLine(false);
    setSelectedShons([]);
    setError('');
  }, []);

  // Select/deselect shons for line drawing
  const toggleShonSelection = useCallback((shonId) => {
    if (isDrawingLine) return;
    
    setSelectedShons(prev => {
      if (prev.includes(shonId)) {
        return prev.filter(id => id !== shonId);
      } else if (prev.length < 2) {
        return [...prev, shonId];
      } else {
        return [prev[1], shonId];
      }
    });
  }, [isDrawingLine]);

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

  // Simplify a line (remove redundant points)
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

  // Get lines for a specific shon
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

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setLines([]);
    setCurrentLine(null);
    setIsDrawingLine(false);
    setSelectedShons([]);
    setError('');
    setLoading(false);
  }, []);

  return {
    // State
    lines,
    currentLine,
    isDrawingLine,
    selectedShons,
    loading,
    error,
    
    // Actions
    fetchLines,
    startDrawingLine,
    addInflectionPoint,
    saveLine,
    cancelDrawing,
    toggleShonSelection,
    deleteLine,
    simplifyLine,
    getLinesForShon,
    clearError,
    reset
  };
};

export default useLineDrawing;
