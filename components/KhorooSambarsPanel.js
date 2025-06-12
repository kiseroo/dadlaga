import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// No inline styles - we'll use the existing classes from main.js

const KhorooSambarsPanel = () => {  const [districts, setDistricts] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [khoroos, setKhoroos] = useState([]);
  const [selectedKhoroo, setSelectedKhoroo] = useState('all');
  const [sambars, setSambars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch districts on component mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/districts');
        const data = await response.json();
        
        if (data.success) {
          setDistricts(data.data);
        } else {
          setError('Failed to load districts');
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
        setError('Error loading districts. Please try again.');
      }
    };
    
    fetchDistricts();
  }, []);
  // Fetch khoroos and sambars when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setKhoroos([]);
      setSelectedKhoroo('all');
      setSambars([]);
      return;
    }
    
    const fetchKhoroos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/districts/${selectedDistrict}/khoroos`);
        const data = await response.json();
        
        if (data.success) {
          setKhoroos(data.data);
        } else {
          setError('Failed to load khoroos');
        }
      } catch (error) {
        console.error('Error fetching khoroos:', error);
        setError('Error loading khoroos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSambarsByDistrict = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use the general sambars endpoint with district query parameter
        const response = await fetch(`http://localhost:3001/api/sambar?district=${selectedDistrict}`);
        const data = await response.json();
        
        if (data.success) {
          setSambars(data.data);
          if (data.data.length === 0) {
            setError('No sambars found in this district');
          }
        } else {
          setError(data.message || 'Failed to load sambars');
        }
      } catch (error) {
        console.error('Error fetching sambars by district:', error);
        setError('Error loading sambars. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch both khoroos and sambars for the selected district
    fetchKhoroos();
    fetchSambarsByDistrict();
    // Set selectedKhoroo to 'all' when a new district is selected
    setSelectedKhoroo('all');
  }, [selectedDistrict]);
  // Handle khoroo selection changes
  useEffect(() => {
    // Skip if no district is selected
    if (!selectedDistrict) return;
    
    // If "All Sambars" is selected, fetch all sambars for the district
    if (selectedKhoroo === 'all') {
      const fetchSambarsByDistrict = async () => {
        try {
          setLoading(true);
          setError('');
          
          const response = await fetch(`http://localhost:3001/api/sambar?district=${selectedDistrict}`);
          const data = await response.json();
          
          if (data.success) {
            setSambars(data.data);
            if (data.data.length === 0) {
              setError('No sambars found in this district');
            }
          } else {
            setError(data.message || 'Failed to load sambars');
          }
        } catch (error) {
          console.error('Error fetching sambars by district:', error);
          setError('Error loading sambars. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSambarsByDistrict();
    } else if (selectedKhoroo) {
      // If a specific khoroo is selected, fetch sambars for that khoroo
      const fetchSambarsByKhoroo = async () => {
        try {
          setLoading(true);
          setError('');
          
          const response = await fetch(
            `http://localhost:3001/api/districts/${selectedDistrict}/khoroos/${selectedKhoroo}/sambars`
          );
          const data = await response.json();
          
          if (data.success) {
            setSambars(data.data.sambars);
            if (data.data.sambars.length === 0) {
              setError('No sambars found in this khoroo');
            }
          } else {
            setError(data.message || 'Failed to load sambars');
          }
        } catch (error) {
          console.error('Error fetching sambars:', error);
          setError('Error loading sambars. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSambarsByKhoroo();
    }
  }, [selectedKhoroo, selectedDistrict]);// Handle viewing a sambar on the map
  const handleViewOnMap = (sambar) => {
    // Open the sambar details directly - this will work for both integrated and standalone use
    // Get the current query params and add our sambarId
    const currentQuery = { ...router.query, sambarId: sambar._id };
    
    // Keep the current path but update the query params
    router.push({
      pathname: router.pathname,
      query: currentQuery
    }, undefined, { shallow: true });
    
    // If we want to handle this in the parent component, we could also use a callback
    // or emit an event, but this direct approach is simpler and works in all cases
  };return (
    <div className="khoroo-search-container">
      <div className="form-group">
        <label htmlFor="district-select">District:</label>
        <select 
          id="district-select"
          className="input-field"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          <option value="">-- Select District --</option>
          {Object.entries(districts).map(([code, district]) => (
            <option key={code} value={code}>
              {district.name}
            </option>
          ))}
        </select>
      </div>
        <div className="form-group">
        <label htmlFor="khoroo-select">Khoroo:</label>
        <select 
          id="khoroo-select"
          className="input-field"
          value={selectedKhoroo}
          onChange={(e) => setSelectedKhoroo(e.target.value)}
          disabled={!selectedDistrict || loading}
        >          <option value="all">All Sambars</option>
          {khoroos
            .slice()
            .sort((a, b) => parseInt(a.number) - parseInt(b.number))
            .map((khoroo) => (
              <option key={`${khoroo.districtCode}-${khoroo.number}`} value={khoroo.number}>
                {khoroo.name || `${khoroo.number}-р хороо`}
              </option>
            ))}
        </select>
      </div>      <div className="button-container">
        {/* Remove the search button since we're now handling changes automatically */}
      </div>
      
      {error && (
        <p className="error-message">{error}</p>
      )}
      
      {loading && (
        <p className="loading-message">Loading sambars...</p>
      )}
      
      {sambars.length > 0 && (
        <div>          <h3>Results ({sambars.length} sambar{sambars.length !== 1 ? 's' : ''})
            {selectedKhoroo === 'all' 
              ? ` - All sambars in ${districts[selectedDistrict]?.name || 'Selected District'}`
              : ` - Khoroo ${selectedKhoroo}`}
          </h3>
          <table className="user-list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sambars.map((sambar) => (
                <tr key={sambar._id}>
                  <td>{sambar.name}</td>
                  <td>{sambar.coordinates.lat.toFixed(6)}</td>
                  <td>{sambar.coordinates.lng.toFixed(6)}</td>
                  <td className="user-actions">
                    <button 
                      className="view-button"
                      onClick={() => handleViewOnMap(sambar)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KhorooSambarsPanel;
