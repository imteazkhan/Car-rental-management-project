import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
    }, []);

    const login = (userData, userToken) => {
        // If backend didn't send a token, generate a basic token compatible with admin.php
        let finalToken = userToken;
        if (!finalToken && userData) {
            const id = userData.id || userData.user_id || '';
            const identity = userData.email || userData.username || 'user';
            try {
                finalToken = btoa(`${id}:${identity}`);
            } catch (e) {
                finalToken = `${id}:${identity}`; // fallback (still truthy)
            }
        }

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', finalToken || ''); // Always store as 'token'
        localStorage.setItem('authToken', finalToken || ''); // Also store as 'authToken' for backward compatibility
        setUser(userData);
        setToken(finalToken || null);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken'); // Remove both token keys
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

