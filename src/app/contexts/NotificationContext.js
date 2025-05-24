'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CHANGE THIS LINE WHEN DEPLOYING
    const API_BASE_URL = 'http://localhost:8080';

    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return '';
    };

    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const apiCall = async (url, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    try {
                        const errorText = await response.text();
                        if (errorText) {
                            errorMessage = errorText;
                        }
                    } catch (textError) {
                        // Ignore
                    }
                }

                throw new Error(errorMessage);
            }

            // Handle 204 No Content responses
            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    };

    // Fetch all notifications
    const fetchNotifications = async () => {
        try {
            setError(null);
            const data = await apiCall('/api/notifications');

            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }

            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError(error.message);
            setNotifications([]);
            setUnreadCount(0);
            throw error;
        }
    };

    const fetchUnreadNotifications = async () => {
        try {
            setError(null);
            const data = await apiCall('/api/notifications/unread');

            if (Array.isArray(data)) {
                setUnreadCount(data.length);
            } else {
                setUnreadCount(0);
            }

            return data;
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            setError(error.message);
            setUnreadCount(0);
            throw error;
        }
    };

    // Fetch unread count only
    const fetchUnreadCount = async () => {
        try {
            setError(null);
            const data = await apiCall('/api/notifications/count');

            if (data && typeof data.unreadCount === 'number') {
                setUnreadCount(data.unreadCount);
            } else {
                setUnreadCount(0);
            }

            return data.unreadCount || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setError(error.message);
            setUnreadCount(0);
            throw error;
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            setLoading(true);
            setError(null);

            // Optimistically update the UI first
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Then make the API call
            const data = await apiCall(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });

            return data;
        } catch (error) {
            console.error('Error marking notification as read:', error);

            // Revert optimistic update on error
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: false } : n
                )
            );
            setUnreadCount(prev => prev + 1);

            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            setLoading(true);
            setError(null);

            // Count current unread notifications for optimistic update
            const currentUnreadCount = notifications.filter(n => !n.read).length;

            // Optimistically update the UI first
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);

            // Then make the API call
            await apiCall('/api/notifications/read-all', {
                method: 'PATCH'
            });

            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);

            // Revert optimistic update on error
            setNotifications(prev =>
                prev.map((n, index) => {
                    // Find which notifications were originally unread
                    const originalNotification = notifications[index];
                    return originalNotification ? { ...n, read: originalNotification.read } : n;
                })
            );
            setUnreadCount(currentUnreadCount);

            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            setLoading(true);
            setError(null);

            // Find the notification to check if it was unread
            const notification = notifications.find(n => n.id === notificationId);
            const wasUnread = notification && !notification.read;

            // Optimistically update the UI first
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Then make the API call - don't expect JSON response
            await apiCall(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);

            // Revert optimistic update on error by refetching
            await fetchNotifications();

            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Utility functions
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_REPORT':
                return '📝';
            case 'STATUS_UPDATE':
                return '🔄';
            case 'NEW_RESPONSE':
                return '💬';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'NEW_REPORT':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'STATUS_UPDATE':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'NEW_RESPONSE':
                return 'text-green-600 bg-green-50 border-green-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h ago`;

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays}d ago`;

            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        const token = getAuthToken();
        if (!token) return;

        // Initial load
        fetchUnreadCount().catch(console.error);

        // Set up periodic refresh
        const interval = setInterval(() => {
            fetchUnreadCount().catch(console.error);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        fetchUnreadNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
        formatDate,
        setError,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};