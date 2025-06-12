import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;        try {
            const res = await fetch('http://localhost:3001/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (data.success) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('user', JSON.stringify(data.user));
                router.push('/main');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Login</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <input 
                        type="email"
                        name="email"
                        placeholder="Email"
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
                <p className="register-link" onClick={() => router.push('/register')}>
                    Register
                </p>
            </div>
        </div>
    );
}
