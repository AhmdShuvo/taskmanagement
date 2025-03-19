// hooks/useUser.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

function useUser() {
    const [user, setUser] = useState(null);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clockedIn, setClockedIn] = useState(false); // New state for clock-in status

    useEffect(() => {
        const token = localStorage.getItem('token');
        const images = localStorage.getItem('image');

        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
                setImage(images);
            } catch (error) {
                console.error("Error decoding token:", error);
                setUser(null);
            }
        } else {
            setUser(null);
        }

        const storedClockedIn = localStorage.getItem('clockedIn'); // Check local storage
        if (storedClockedIn === 'true') { // Convert string back to boolean
            setClockedIn(true);
        }

        setLoading(false);
    }, []);

    // Update local storage when clockedIn state changes
    useEffect(() => {
        localStorage.setItem('clockedIn', clockedIn); // Store as string
    }, [clockedIn]);

    return { user, image, loading, clockedIn, setClockedIn }; // Return clockedIn and setClockedIn
}

export default useUser;