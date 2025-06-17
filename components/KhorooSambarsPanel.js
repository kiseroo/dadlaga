import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LocationEditModal from './LocationEditModal';


const KhorooSambarsPanel = () => {
  const [districts, setDistricts] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [khoroos, setKhoroos] = useState([]);
  const [selectedKhoroo, setSelectedKhoroo] = useState('all');
  const [sambars, setSambars] = useState([]);
  const [filteredSambars, setFilteredSambars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentSambar, setCurrentSambar] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [sambarToDelete, setSambarToDelete] = useState(null);
  const router = useRouter();

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
  }, []);  // Add a new useEffect for initial load of all sambars
  useEffect(() => {
    const fetchAllSambars = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`http://localhost:3001/api/sambar`);
        const data = await response.json();
        
        if (data.success) {
          setSambars(data.data);
          if (data.data.length === 0) {
            setError('No sambars found');
          }
        } else {
          setError(data.message || 'Failed to load sambars');
        }
      } catch (error) {
        console.error('Error fetching all sambars:', error);
        setError('Error loading sambars. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSambars();
  }, []);

  useEffect(() => {
    if (!selectedDistrict) {
      setKhoroos([]);
      setSelectedKhoroo('all');
      // No longer clearing sambars here, as we want to show all sambars
      const fetchAllSambars = async () => {
        try {
          setLoading(true);
          setError('');
          
          const response = await fetch(`http://localhost:3001/api/sambar`);
          const data = await response.json();
          
          if (data.success) {
            setSambars(data.data);
            if (data.data.length === 0) {
              setError('No sambars found');
            }
          } else {
            setError(data.message || 'Failed to load sambars');
          }
        } catch (error) {
          console.error('Error fetching all sambars:', error);
          setError('Error loading sambars. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchAllSambars();
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
    
    fetchKhoroos();
    fetchSambarsByDistrict();
    setSelectedKhoroo('all');
  }, [selectedDistrict]);
  useEffect(() => {
    if (!selectedDistrict) return;
    
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
  }, [selectedKhoroo, selectedDistrict]);  const handleViewOnMap = (sambar) => {
    setCurrentSambar(sambar);
    setIsMapModalOpen(true);
  };
  
  const closeMapModal = () => {
    setIsMapModalOpen(false);
    setCurrentSambar(null);
  };
  const handleLocationChange = (newLocation) => {
    // Store the updated location temporarily
    console.log("Location updated:", newLocation);
    if (currentSambar) {
      setCurrentSambar(prevSambar => ({
        ...prevSambar,
        coordinates: {
          lat: parseFloat(newLocation.lat),
          lng: parseFloat(newLocation.lng)
        }
      }));
    }
  };
  
  const handleKhorooInfoChange = (newKhorooInfo) => {
    // Store the updated khoroo info temporarily
    console.log("Khoroo info updated:", newKhorooInfo);
    if (currentSambar) {
      setCurrentSambar(prevSambar => ({
        ...prevSambar,
        khorooInfo: {
          ...newKhorooInfo,
          district: newKhorooInfo.district || prevSambar.khorooInfo?.district,
          khoroo: newKhorooInfo.khoroo || prevSambar.khorooInfo?.khoroo,
          name: newKhorooInfo.name || prevSambar.khorooInfo?.name
        }
      }));
    }
  };
  const handleUpdateLocation = async (sambar) => {
    try {
      setLoading(true);
      console.log('Updating sambar with data:', {
        coordinates: sambar.coordinates,
        khorooInfo: sambar.khorooInfo,
        name: sambar.name
      });
      
      // Call the API to update the location
      const response = await fetch(`http://localhost:3001/api/sambar/${sambar._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: sambar.name,
          coordinates: sambar.coordinates,
          khorooInfo: sambar.khorooInfo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Update successful, response data:', data.data);
        // Update the sambar in the local state
        setSambars(sambars.map(s => s._id === sambar._id ? {...s, ...data.data} : s));
        setError('');
        alert('Location updated successfully!');
        
        // Reload the data to ensure we have the latest from the server
        const refreshResponse = await fetch(`http://localhost:3001/api/sambar`);
        const refreshData = await refreshResponse.json();
        
        if (refreshData.success) {
          setSambars(refreshData.data);
        }
        
        closeMapModal();
      } else {
        setError(data.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Error updating location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update filtered sambars whenever sambars or searchTerm changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSambars(sambars);
    } else {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const filtered = sambars.filter(sambar => 
        sambar.name.toLowerCase().includes(lowercaseSearchTerm)
      );
      setFilteredSambars(filtered);
    }
  }, [sambars, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The filtering is handled by the useEffect above
    if (searchTerm.trim() === '') {
      setError('');
    } else if (filteredSambars.length === 0) {
      setError(`No sambars found matching "${searchTerm}"`);
    } else {
      setError('');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setError('');
  };

  const handleDelete = (sambar) => {
    setSambarToDelete(sambar);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!sambarToDelete) return;
    
    try {
      setLoading(true);
      // Call the API to delete the sambar
      const response = await fetch(`http://localhost:3001/api/sambar/${sambarToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the sambar from the local state
        setSambars(sambars.filter(s => s._id !== sambarToDelete._id));
        setError('');
        alert('Sambar deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete sambar');
      }
    } catch (error) {
      console.error('Error deleting sambar:', error);
      setError('Error deleting sambar. Please try again.');
    } finally {
      setLoading(false);
      setIsConfirmDeleteOpen(false);
      setSambarToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setSambarToDelete(null);
  };

  return (
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
        </select>      </div>      <div className="button-container">
        {/* tically */}
      </div>

      <div className="form-group search-form">
        <form onSubmit={handleSearch}>
          <div className="search-container">
            <label htmlFor="name-search">Search by Name:</label>
            <div className="search-input-group">
              <input
                id="name-search"
                type="text"
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter sambar name..."
              />
              <button type="submit" className="search-button">
                Search
              </button>
              {searchTerm && (
                <button 
                  type="button" 
                  className="clear-button"
                  onClick={handleClearSearch}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      
      {error && (
        <p className="error-message">{error}</p>
      )}
        {loading && (
        <p className="loading-message">Loading sambars...</p>
      )}
      
      {filteredSambars.length > 0 && (
        <div>          <h3>Results ({filteredSambars.length} sambar{filteredSambars.length !== 1 ? 's' : ''})
            {searchTerm ? ` - Search: "${searchTerm}"` : 
              !selectedDistrict 
                ? ' - All sambars'
                : selectedKhoroo === 'all' 
                  ? ` - All sambars in ${districts[selectedDistrict]?.name || 'Selected District'}`
                  : ` - Khoroo ${selectedKhoroo}`}
          </h3>
          <table className="user-list">
            <thead>
              <tr>
                <th>Name</th>
                {!selectedDistrict && <th>District</th>}
                {!selectedDistrict && <th>Khoroo</th>}
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSambars.map((sambar) => (
                <tr key={sambar._id}>
                  <td>{sambar.name}</td>
                  {!selectedDistrict && (
                    <td>{districts[sambar.districtCode]?.name || sambar.districtCode}</td>
                  )}
                  {!selectedDistrict && (
                    <td>{sambar.khorooInfo?.name || sambar.khorooInfo?.number || 'N/A'}</td>
                  )}
                  <td>{sambar.coordinates.lat.toFixed(6)}</td>
                  <td>{sambar.coordinates.lng.toFixed(6)}</td>
                  <td className="user-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleViewOnMap(sambar)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(sambar)}
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
      {/* Using the LocationEditModal component */}
      <LocationEditModal
        isOpen={isMapModalOpen}
        sambar={currentSambar}
        onClose={closeMapModal}
        onLocationChange={handleLocationChange}
        onKhorooInfoChange={handleKhorooInfoChange}
        onUpdate={handleUpdateLocation}
      />
      {isConfirmDeleteOpen && (
        <div className="confirm-delete-modal">
          <p>Are you sure you want to delete this sambar?</p>
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

export default KhorooSambarsPanel;
