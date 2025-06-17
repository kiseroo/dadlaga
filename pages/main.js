import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const LocationEditModal = dynamic(
  () => import('../components/LocationEditModal'),
  { ssr: false }
);

const Map = dynamic(
  () => import('../components/Map').then(mod => mod.default),
  { ssr: false }
);

const MapEdit = dynamic(
  () => import('../components/MapEdit'),
  { ssr: false }
);

const KhorooSambarsPanel = dynamic(
  () => import('../components/KhorooSambarsPanel'),
  { ssr: false }
);

export default function Main() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [sambars, setSambars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [editingSambar, setEditingSambar] = useState(null);
    const [sambarFormData, setSambarFormData] = useState({
        name: '',
        coordinates: { lat: '', lng: '' }
    });

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            router.replace('/');
            return;
        }

        const userData = sessionStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }

        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'sambars') {
            fetchSambars();
            
            // Check if there's a sambarId in the URL query parameters
            const { sambarId } = router.query;
            if (sambarId) {
                // Set activeTab to sambars to make sure we're on the right tab
                setActiveTab('sambars');
                
                // Fetch the specific sambar to view/edit
                const fetchSambarById = async () => {
                    try {
                        const response = await fetch(`http://localhost:3001/api/sambar/${sambarId}`);
                        const data = await response.json();
                        
                        if (data.success) {
                            // Found the sambar, let's view it
                            handleViewSambar(data.data);
                        }
                    } catch (error) {
                        console.error("Error fetching sambar by ID:", error);
                    }
                };
                
                fetchSambarById();
            }
        }
    }, [activeTab, router.query]);
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/users');
            const data = await res.json();
            
            if (data.success) {
                setUsers(data.data || []);
            } else {
                setError('Failed');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSambars = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/sambar');
            const data = await res.json();
            
            if (data.success) {
                setSambars(data.data || []);
            } else {
                setError('Failed to fetch locations');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('user');
        router.replace('/');
    };    const handleDeleteUser = async (id) => {
        if (!confirm('are you sure??')) {
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:3001/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            if (data.success) {
                setUsers(users.filter(user => user._id !== id));
            } else {
                setError(data.message || 'Failed to delete user');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };
    
    const handleEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: ''
        });
    };
    
    const handleCancelEdit = () => {
        setEditingUser(null);
        setFormData({ email: '', password: '' });
    };
    
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
      const handleUpdateUser = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch(`http://localhost:3001/api/users/${editingUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(user => 
                    user._id === editingUser._id 
                    ? { ...user, email: formData.email } 
                    : user
                ));
                setEditingUser(null);
                setFormData({ email: '', password: '' });
            } else {
                setError(data.message || 'Failed to update user');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };
      const handleAddUser = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                setFormData({ email: '', password: '' });
            } else {
                setError(data.message || 'Failed to add user');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };    const renderDashboard = () => {
        return (
            <div>
                <div className="content-card">
                    <h2>Welcome to the Dashboard</h2>
                    {currentUser && (
                        <div>
                            <p>Logged in as: {currentUser.email}</p>
                        </div>
                    )}
                    <p>
                        This is a simple dashboard to manage users. Use the tabs above to navigate.
                    </p>
                </div>
                  <div className="content-card">
                    <h2>Location Map</h2>
                    <Map />
                </div>
            </div>
        );
    };
    
    const renderUserList = () => {
        if (loading) {
            return <p>Loading users...</p>;
        }
        
        if (error) {
            return <p className="error-message">{error}</p>;
        }
        
        return (
            <div>
                <div className="content-card">
                    <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                    <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="user-form">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            className="input-field"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                            className="input-field"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!editingUser}
                        />
                        <div className="button-container">
                            {editingUser && (
                                <button type="button" onClick={handleCancelEdit} className="cancel-button">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="submit-button">
                                {editingUser ? 'Update User' : 'Add User'}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="content-card">
                    <h2>User List</h2>
                    {users.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        <table className="user-list">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.email}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="user-actions">
                                            <button 
                                                onClick={() => handleEditUser(user)}
                                                className="edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };    const renderSambarList = () => {
        if (loading) {
            return <p>Loading locations...</p>;
        }
        
        if (error) {
            return <p className="error-message">{error}</p>;
        }
        
        return (
            <div>                {/* Khoroo search section */}
                <div className="content-card">
                    <h2>Search Sambars by Khoroo</h2>
                    <KhorooSambarsPanel />
                </div>

                <div className="content-card">
                    <h2>{editingSambar ? 'Edit Location' : 'Location List'}</h2>
                    {editingSambar && (
                        <form onSubmit={handleUpdateSambar} className="user-form">
                            <input
                                type="text"
                                name="name"
                                placeholder="Location Name"
                                required
                                className="input-field"
                                value={sambarFormData.name}
                                onChange={handleSambarInputChange}
                            />                              <div className="map-edit-wrapper">                                <MapEdit 
                                    key={`edit-map-${editingSambar._id}`}
                                    initialLocation={{
                                        lat: parseFloat(sambarFormData.coordinates.lat),
                                        lng: parseFloat(sambarFormData.coordinates.lng)
                                    }}
                                    sambar={editingSambar}
                                    onLocationChange={(newLocation) => {
                                        setSambarFormData(prev => ({
                                            ...prev,
                                            coordinates: {
                                                lat: newLocation.lat,
                                                lng: newLocation.lng
                                            }
                                        }));
                                    }}
                                    onKhorooInfoChange={(updatedKhorooInfo) => {
                                        // Store the updated district and khoroo info
                                        console.log("KhorooInfo updated:", updatedKhorooInfo);
                                        // This will be accessible in handleUpdateSambar
                                        if (!sambarFormData.khorooInfo) {
                                            setSambarFormData(prev => ({
                                                ...prev,
                                                khorooInfo: updatedKhorooInfo
                                            }));
                                        } else {
                                            setSambarFormData(prev => ({
                                                ...prev,
                                                khorooInfo: {
                                                    ...prev.khorooInfo,
                                                    district: updatedKhorooInfo.district,
                                                    khoroo: updatedKhorooInfo.khoroo
                                                }
                                            }));
                                        }
                                    }}
                                />
                            </div>                              {/* test */}
                            <div className="button-container">
                                <button type="button" onClick={handleCancelSambarEdit} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="submit-button">
                                    Update Location
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                <div className="content-card">
                    <h2>Saved Locations</h2>
                    {sambars.length === 0 ? (
                        <p>No locations found.</p>
                    ) : (
                        <table className="user-list">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Latitude</th>
                                    <th>Longitude</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sambars.map(sambar => (
                                    <tr key={sambar._id}>
                                        <td>{sambar.name}</td>
                                        <td>{sambar.coordinates?.lat}</td>
                                        <td>{sambar.coordinates?.lng}</td>
                                        <td>{new Date(sambar.createdAt).toLocaleDateString()}</td>
                                        <td className="user-actions">
                                            <button 
                                                onClick={() => handleEditSambar(sambar)}
                                                className="edit-button"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSambar(sambar._id)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };    const handleEditSambar = (sambar) => {
        setEditingSambar(sambar);
        
        setSambarFormData({
            name: sambar.name,
            coordinates: {
                lat: parseFloat(sambar.coordinates.lat),
                lng: parseFloat(sambar.coordinates.lng)
            },
            khorooInfo: sambar.khorooInfo ? { ...sambar.khorooInfo } : null
        });

        // Show modal for editing
        setIsMapModalOpen(true);
    };
    
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    
    const closeMapModal = () => {
        setIsMapModalOpen(false);
    };
    
    const handleLocationChange = (newLocation) => {
        setSambarFormData(prev => ({
            ...prev,
            coordinates: newLocation
        }));
    };
    
    const handleKhorooInfoChange = (newKhorooInfo) => {
        setSambarFormData(prev => ({
            ...prev,
            khorooInfo: newKhorooInfo
        }));
    };
    
    const handleUpdateLocationFromModal = async (sambar) => {
        try {
            const response = await fetch(`http://localhost:3001/api/sambar/${sambar._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinates: sambarFormData.coordinates,
                    khorooInfo: sambarFormData.khorooInfo
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update the local data
                setSambars(sambars.map(s => s._id === sambar._id ? { ...s, ...data.data } : s));
                alert('Location updated successfully!');
                closeMapModal();
            } else {
                setError(data.message || 'Failed to update location');
            }
        } catch (error) {
            console.error('Error updating location:', error);
            setError('Error updating location. Please try again.');
        }
    };

    const handleCancelSambarEdit = () => {
        setEditingSambar(null);
        setSambarFormData({
            name: '',
            coordinates: { lat: '', lng: '' }
        });
    };

    const handleSambarInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'lat' || name === 'lng') {
            setSambarFormData(prev => ({
                ...prev,
                coordinates: {
                    ...prev.coordinates,
                    [name]: value
                }
            }));
        } else {
            setSambarFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };    const handleUpdateSambar = async (e) => {
        e.preventDefault();
        
        try {            let district = null;
            let khoroo = null;
            
            // Use the khorooInfo from our form data which is updated by the MapEdit component
            if (sambarFormData.khorooInfo && sambarFormData.khorooInfo.district && sambarFormData.khorooInfo.khoroo) {
                district = sambarFormData.khorooInfo.district;
                khoroo = sambarFormData.khorooInfo.khoroo;
                console.log("Using district/khoroo from form data:", district, khoroo);
            }
            // Then try to get from existing khorooInfo
            else if (editingSambar.khorooInfo) {
                district = editingSambar.khorooInfo.district;
                khoroo = editingSambar.khorooInfo.khoroo;
                console.log("Using district/khoroo from existing khorooInfo:", district, khoroo);
            }
            // Finally try extracting from name as fallback
            else {
                const originalName = editingSambar.name;
                if (originalName && originalName.match(/^[a-z]{3}-\d+$/i)) {
                    const parts = originalName.split('-');
                    district = parts[0].toLowerCase();
                    khoroo = parts[1];
                    console.log("Extracted district/khoroo from name:", district, khoroo);
                } else if (originalName && originalName.match(/\d+$/)) {
                    // If we at least have district from somewhere
                    if (district) {
                        const match = originalName.match(/\d+$/);
                        khoroo = match[0];
                        console.log("Extracted khoroo number from name:", khoroo);
                    }
                }
            }
            
            if (!district || !khoroo) {
                console.error("Could not extract district/khoroo information:", editingSambar);
            }            
            let updatedName = sambarFormData.name; 
            
            const updatedKhorooInfo = {
                name: `${district}_${khoroo}`,
                district: district,
                khoroo: khoroo 
            };
            
           
            if (khoroo && khoroo.length === 1 && parseInt(khoroo) < 10) {
                console.log("Preserving single-digit khoroo format:", khoroo);
            }
            
            const updateData = {
                name: updatedName, 
                coordinates: {
                    lat: Number(sambarFormData.coordinates.lat),
                    lng: Number(sambarFormData.coordinates.lng)
                },
                khorooInfo: updatedKhorooInfo
            };
            
            console.log("Updating sambar with data:", updateData);
            
            const res = await fetch(`http://localhost:3001/api/sambar/${editingSambar._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            const data = await res.json();
            if (data.success) {
                setSambars(sambars.map(sambar => 
                    sambar._id === editingSambar._id 
                    ? { 
                        ...sambar, 
                        name: updateData.name,
                        coordinates: updateData.coordinates,
                        khorooInfo: updateData.khorooInfo
                    } 
                    : sambar
                ));
                handleCancelSambarEdit();
            } else {
                setError(data.message || 'Failed to update location');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };

    const handleDeleteSambar = async (id) => {
        if (!confirm('Are you sure you want to delete this location?')) {
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:3001/api/sambar/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            if (data.success) {
                setSambars(sambars.filter(sambar => sambar._id !== id));
            } else {
                setError(data.message || 'Failed to delete location');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };

    const handleViewSambar = (sambar) => {
        // Set the selected sambar for viewing
        setEditingSambar(sambar);
        
        // Fill the form data but don't allow editing (view only)
        setSambarFormData({
            name: sambar.name,
            coordinates: {
                lat: parseFloat(sambar.coordinates.lat),
                lng: parseFloat(sambar.coordinates.lng)
            },
            khorooInfo: sambar.khorooInfo ? { ...sambar.khorooInfo } : null
        });
    };

    return (
        <div className="main-container">
            <div className="main-header">
                <h1 className="main-title">User Management</h1>
                <button 
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>
            </div>
              <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Manage Users
                </button>                <button 
                    className={`tab ${activeTab === 'sambars' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sambars')}
                >
                    Manage Sambars
                </button>
            </div>
            
            {activeTab === 'dashboard' ? renderDashboard() : activeTab === 'users' ? renderUserList() : renderSambarList()}
        </div>
    );
}
