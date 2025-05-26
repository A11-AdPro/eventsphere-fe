'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const AdminUserContext = createContext();

export const useAdminUser = () => {
    const context = useContext(AdminUserContext);
    if (!context) {
        throw new Error('useAdminUser must be used within an AdminUserProvider');
    }
    return context;
};

export const AdminUserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'http://34.193.71.203';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const getAllUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/users`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/${id}`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch user');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (id, updateData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(prevUsers => 
                    prevUsers.map(user => user.id === id ? data : user)
                );
                return { success: true, data, message: 'User updated successfully' };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
                return { success: true, message: 'User deleted successfully' };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOwnProfile = useCallback(async (updateData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data, message: 'Profile updated successfully' };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const getUsersByRole = useCallback(async (role) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/role/${role}`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users by role');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        users,
        loading,
        error,
        getAllUsers,
        getUserById,
        updateUser,
        deleteUser,
        updateOwnProfile,
        getUsersByRole,
        clearError,
    };

    return (
        <AdminUserContext.Provider value={value}>
            {children}
        </AdminUserContext.Provider>
    );
};