// hooks/useCurrentUser.js
import { useState, useEffect } from 'react';

function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState(' ');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            setIsLoading(true);
            setError(null); // Reset error

            try {
                const token = localStorage.getItem('token'); // Or however you store your token

                if (!token) {
                    setCurrentUser(null); // Not logged in
                    setIsLoading(false);
                    return;
                }

                const response = await fetch('/api/current-user', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Send the token
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    setCurrentUser(data.data);
                } else {
                    setError(data.message || "Failed to fetch user.");
                    setCurrentUser(null); // Clear user data if fetch fails
                }
            } catch (err) {
                console.error("Error fetching current user:", err);
                setError(err.message || "An error occurred while fetching user.");
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, []); // Empty dependency array: only run once on mount
console.log(currentUser,"currentUser");

    return { currentUser, isLoading, error };
}

export default useCurrentUser;