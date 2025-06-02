import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (data.success) {
                sessionStorage.setItem('isLoggedIn', 'true');
                router.push('/main');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Error connecting to server');
        }
    };    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Welcome Back</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <input 
                        type="text" 
                        name="username" 
                        placeholder="Username" 
                        required 
                        className="input-field"
                    />
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Password" 
                        required 
                        className="input-field"
                    />
                    <button 
                        type="submit"
                        className="submit-button"
                    >
                        Login
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>
        </div>
    );
}
