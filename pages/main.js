import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import the Map component with no SSR to avoid window is not defined errors
const Map = dynamic(() => import('../components/Map'), {
  ssr: false
});

export default function Main() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });

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
        }
    }, [activeTab]);    const fetchUsers = async () => {
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
            </div>
            
            {activeTab === 'dashboard' ? renderDashboard() : renderUserList()}
        </div>
    );
}
