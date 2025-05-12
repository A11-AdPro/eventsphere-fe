'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '../config/apiConfig';

const AuthContext = createContext();

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
            // ⬇️ Debug: console.log untuk melihat apa yang diimpor
            console.log('API_ROUTES:', API_ROUTES);

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
            console.log('Login URL:', API_ROUTES?.AUTH?.LOGIN); // Debug log

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
                const errorData = await response.json();
                return {
                    success: false,
                    message: errorData.message || 'Login gagal. Silakan coba lagi.',
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Terjadi kesalahan saat login' };
        }
    };

    const register = async (userData) => {
        try {
            console.log('Register URL:', API_ROUTES?.AUTH?.REGISTER); // Debug log

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
                const errorData = await response.json();
                return {
                    success: false,
                    message: errorData.message || 'Registrasi gagal. Silakan coba lagi.',
                };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Terjadi kesalahan saat registrasi' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);