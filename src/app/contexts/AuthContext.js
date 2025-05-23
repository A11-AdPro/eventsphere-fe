'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

// CHANGE THIS LINE WHEN DEPLOYING
// Development: 'http://localhost:8080'
// Production:  'http://34.193.71.203'
const API_BASE_URL = 'http://localhost:8080';
// const API_BASE_URL = 'http://34.193.71.203'

const API_ROUTES = {
    AUTH: {
        LOGIN: `${API_BASE_URL}/api/auth/login`,
        REGISTER: `${API_BASE_URL}/api/auth/register`,
        ME: `${API_BASE_URL}/api/auth/me`,
    },
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserData = async (token) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.ME, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                await fetchUserData(data.token);
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    message: errorData.message || 'Login gagal. Periksa email dan password Anda.',
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: 'Terjadi kesalahan saat login.' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(API_ROUTES.AUTH.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    message: errorData.message || 'Registrasi gagal. Silakan coba lagi.',
                };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { 
                success: false, 
                message: 'Terjadi kesalahan saat registrasi.' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            register, 
            logout,
            API_ROUTES // Export API routes for other components
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};