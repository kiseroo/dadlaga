import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import the Map component with no SSR to avoid window is not defined errors
const Map = dynamic(() => import('../components/Map'), {
  ssr: false
});

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
        }
    }, [activeTab]);    
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
    };

    const renderSambarList = () => {
        if (loading) {
            return <p>Loading locations...</p>;
        }
        
        if (error) {
            return <p className="error-message">{error}</p>;
        }
        
        return (
            <div>
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
                            />
                            <input
                                type="number"
                                name="lat"
                                placeholder="Latitude"
                                required
                                step="any"
                                className="input-field"
                                value={sambarFormData.coordinates.lat}
                                onChange={handleSambarInputChange}
                            />
                            <input
                                type="number"
                                name="lng"
                                placeholder="Longitude"
                                required
                                step="any"
                                className="input-field"
                                value={sambarFormData.coordinates.lng}
                                onChange={handleSambarInputChange}
                            />
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
    };

    const handleEditSambar = (sambar) => {
        setEditingSambar(sambar);
        setSambarFormData({
            name: sambar.name,
            coordinates: {
                lat: sambar.coordinates.lat,
                lng: sambar.coordinates.lng
            }
        });
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
    };

    const handleUpdateSambar = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch(`http://localhost:3001/api/sambar/${editingSambar._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sambarFormData)
            });
            
            const data = await res.json();
            if (data.success) {
                setSambars(sambars.map(sambar => 
                    sambar._id === editingSambar._id 
                    ? { ...sambar, ...sambarFormData } 
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
                </button>
                <button 
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
