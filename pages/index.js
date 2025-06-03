import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;        // Changed from username to email
        const password = e.target.password.value;

        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })  // Changed from username to email
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
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">test</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <input 
                        type="email"               // Changed from text to email
                        name="email"               // Changed from username to email
                        placeholder="Email"        // Updated placeholder
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
