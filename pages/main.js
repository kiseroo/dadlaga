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
                <h1 className="main-title">Welcome to Main page</h1>
                <button 
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>
            </div>
            <div className="content-card">
                <p className="welcome-text">
                    Main page.
                </p>
            </div>
        </div>
    );
}
