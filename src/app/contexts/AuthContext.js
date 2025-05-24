'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

// CHANGE THIS LINE WHEN DEPLOYING
// Development: 'http://localhost:8080'
// Production:  'http://34.193.71.203'
const API_BASE_URL = 'http://localhost:8080';
// const API_BASE_URL = 'http://34.193.71.203';

const AUTH_API_ROUTES = {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ADMIN_REGISTER: `${API_BASE_URL}/api/auth/admin/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchCurrentUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const getAuthHeaders = (token = null) => {
        const authToken = token || localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        };
    };

    const fetchCurrentUser = async (token = null) => {
        try {
            const response = await fetch(AUTH_API_ROUTES.ME, {
                headers: getAuthHeaders(token)
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return { success: true, user: userData };
            } else {
                localStorage.removeItem('token');
                setUser(null);
                return { success: false, message: 'Session expired' };
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('token');
            setUser(null);
            return { success: false, message: 'Network error' };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(AUTH_API_ROUTES.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                
                const userResult = await fetchCurrentUser(data.token);
                if (userResult.success) {
                    return { success: true, user: userResult.user };
                }
                return { success: true, user: { email: data.email, role: data.role } };
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
                message: 'Terjadi kesalahan saat login. Periksa koneksi internet Anda.' 
            };
        }
    };

    const register = async (userData) => {
        try {
            const registerData = {
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                role: userData.role || 'ATTENDEE' // Default to ATTENDEE
            };

            const response = await fetch(AUTH_API_ROUTES.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            if (response.ok) {
                return { success: true, message: 'Registrasi berhasil!' };
            } else {
                let errorMessage = 'Registrasi gagal. Silakan coba lagi.';
                
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText.includes('Email already in use')) {
                        errorMessage = 'Email sudah terdaftar. Gunakan email lain.';
                    }
                }

                return { success: false, message: errorMessage };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { 
                success: false, 
                message: 'Terjadi kesalahan saat registrasi. Periksa koneksi internet Anda.' 
            };
        }
    };

    const adminRegister = async (userData) => {
        try {
            const registerData = {
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName,
                role: userData.role // Can be ADMIN, ORGANIZER, or ATTENDEE
            };

            const response = await fetch(AUTH_API_ROUTES.ADMIN_REGISTER, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(registerData),
            });

            if (response.ok) {
                return { success: true, message: 'User berhasil didaftarkan!' };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    message: errorData.message || 'Gagal mendaftarkan user.',
                };
            }
        } catch (error) {
            console.error('Admin register error:', error);
            return { 
                success: false, 
                message: 'Terjadi kesalahan saat mendaftarkan user.' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async () => {
        return await fetchCurrentUser();
    };

    const isAdmin = () => user?.role === 'ADMIN';
    const isOrganizer = () => user?.role === 'ORGANIZER';
    const isAttendee = () => user?.role === 'ATTENDEE';

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            register, 
            adminRegister,
            logout,
            refreshUser,
            isAdmin,
            isOrganizer,
            isAttendee,
            AUTH_API_ROUTES
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