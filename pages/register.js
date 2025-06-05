import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Register() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;

        // Basic validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }        try {
            const res = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Registration successful! Redirecting to login...');
                setError('');
                
                // Redirect to login after a delay
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Create Account</h1>
                {success && <p className="success-message">{success}</p>}
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
                    <input 
                        type="password" 
                        name="confirmPassword" 
                        placeholder="Confirm Password" 
                        required 
                        className="input-field"
                    />
                    <button 
                        type="submit"
                        className="submit-button"
                    >
                        Register
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </form>
                <p className="register-link" onClick={() => router.push('/')}>
                    Login
                </p>
            </div>
        </div>
    );
}
