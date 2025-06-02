import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Main() {
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            router.replace('/');
        }
    }, []);    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        router.replace('/');
    };    return (
        <div className="main-container">
            <div className="main-header">
                <h1 className="main-title">Welcome to Dashboard</h1>
                <button 
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>
            </div>
            <div className="content-card">
                <p className="welcome-text">
                    Welcome to your dashboard. This is a protected page that can only be accessed after login.
                </p>
            </div>
        </div>
    );
}
