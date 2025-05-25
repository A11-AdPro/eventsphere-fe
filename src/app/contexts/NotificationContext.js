'use client';

import {createContext, useContext, useEffect, useState} from 'react';

// Membuat context untuk notifikasi
const NotificationContext = createContext();

// Hook untuk mengakses context notifikasi
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Penyedia context notifikasi untuk aplikasi
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Menyimpan daftar notifikasi
    const [unreadCount, setUnreadCount] = useState(0); // Menyimpan jumlah notifikasi yang belum dibaca
    const [loading, setLoading] = useState(false); // Menyimpan status loading
    const [error, setError] = useState(null); // Menyimpan error jika ada

    // URL API untuk pengambilan data notifikasi
    const API_BASE_URL = 'http://localhost:8080';

    // Mendapatkan token autentikasi dari localStorage
    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return '';
    };

    // Menyusun header untuk autentikasi
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    // Fungsi umum untuk melakukan panggilan API
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
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }

                throw new Error(errorMessage);
            }

            // Menangani respons kosong (204 No Content)
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

    // Mengambil semua notifikasi
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

    // Mengambil notifikasi yang belum dibaca
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

    // Mengambil jumlah notifikasi yang belum dibaca
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

    // Menandai notifikasi sebagai dibaca
    const markAsRead = async (notificationId) => {
        try {
            setLoading(true);
            setError(null);

            // Update UI secara optimis
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Melakukan panggilan API untuk menandai sebagai dibaca
            return await apiCall(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);

            // Mengembalikan perubahan UI jika terjadi kesalahan
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

    // Menandai semua notifikasi sebagai dibaca
    const markAllAsRead = async () => {
        try {
            setLoading(true);
            setError(null);

            // Menghitung jumlah notifikasi yang belum dibaca untuk pembaruan UI optimis
            notifications.filter(n => !n.read).length;
// Update UI secara optimis
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);

            // Melakukan panggilan API untuk menandai semua sebagai dibaca
            await apiCall('/api/notifications/read-all', {
                method: 'PATCH'
            });

            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);

            // Mengembalikan pembaruan UI jika terjadi kesalahan
            setNotifications(prev =>
                prev.map((n, index) => {
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

    // Menghapus notifikasi
    const deleteNotification = async (notificationId) => {
        try {
            setLoading(true);
            setError(null);

            const notification = notifications.find(n => n.id === notificationId);
            const wasUnread = notification && !notification.read;

            // Update UI secara optimis
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Melakukan panggilan API untuk menghapus notifikasi
            await apiCall(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);

            // Mengembalikan pembaruan UI jika terjadi kesalahan
            await fetchNotifications();

            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Menampilkan ikon berdasarkan jenis notifikasi
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_REPORT': return '📝';
            case 'STATUS_UPDATE': return '🔄';
            case 'NEW_RESPONSE': return '💬';
            case 'STAFF_RESPONSE': return '👨‍💼';
            case 'ADMIN_RESPONSE': return '👑';
            default: return '🔔';
        }
    };

    // Menampilkan warna berdasarkan jenis notifikasi
    const getNotificationColor = (type) => {
        switch (type) {
            case 'NEW_REPORT': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'STATUS_UPDATE': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'NEW_RESPONSE': return 'text-green-600 bg-green-50 border-green-200';
            case 'STAFF_RESPONSE': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'ADMIN_RESPONSE': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Format tanggal untuk menampilkan waktu relatif
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

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            console.log('No auth token found, skipping notification fetch');
            return;
        }

        console.log('Setting up notification fetching...');

        // Initial load
        fetchUnreadCount().catch(console.error);

        // Set up periodic refresh - more frequent for testing
        const interval = setInterval(() => {
            console.log('Refreshing notification count...');
            fetchUnreadCount().catch(console.error);
        },); // 10 seconds for testing, change back to 30000 in roduction

        return () => {
            console.log('Cleaning up notification interval');
            clearInterval(interval);
        };
    }, []);

    // Context value yang akan dipakai oleh komponen lain
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
