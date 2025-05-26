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
    const [isPolling, setIsPolling] = useState(false); // Status polling untuk async
    const [lastPollingTime, setLastPollingTime] = useState(null); // Waktu polling terakhir

    // URL API untuk pengambilan data notifikasi
    const API_BASE_URL = 'http://34.193.71.203';

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

    // Mengambil jumlah notifikasi yang belum dibaca (Async optimized)
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

    // Async real-time notification check
    const checkForNewNotifications = async () => {
        try {
            setIsPolling(true);
            const currentTime = new Date();

            // Fetch latest notifications
            const latestNotifications = await apiCall('/api/notifications');

            if (Array.isArray(latestNotifications) && latestNotifications.length > 0) {
                const currentUnreadCount = latestNotifications.filter(n => !n.read).length;

                // Check if there are new notifications since last check
                if (notifications.length > 0 && latestNotifications.length > notifications.length) {
                    const newNotifications = latestNotifications.slice(0, latestNotifications.length - notifications.length);

                    // Show browser notification for new notifications
                    if ('Notification' in window && Notification.permission === 'granted') {
                        newNotifications.forEach((notification, index) => {
                            setTimeout(() => {
                                new Notification('EventSphere - New Notification', {
                                    body: notification.title,
                                    icon: '/favicon.ico',
                                    tag: notification.id,
                                    badge: '/favicon.ico'
                                });
                            }, index * 1000); // Stagger notifications by 1 second
                        });
                    }

                    // Dispatch custom event for UI updates
                    if (typeof window !== 'undefined') {
                        const event = new CustomEvent('newNotificationReceived', {
                            detail: {
                                count: currentUnreadCount,
                                newNotifications: newNotifications
                            }
                        });
                        window.dispatchEvent(event);
                    }

                    console.log(`🔔 ${newNotifications.length} new notifications received asynchronously`);
                }

                // Update state
                setNotifications(latestNotifications);
                setUnreadCount(currentUnreadCount);
            }

            setLastPollingTime(currentTime);
            return latestNotifications;
        } catch (error) {
            console.error('Error in async notification check:', error);
            return [];
        } finally {
            setIsPolling(false);
        }
    };

    // Menandai notifikasi sebagai dibaca (Async)
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
            const result = await apiCall(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });

            console.log(`✅ Notification ${notificationId} marked as read asynchronously`);
            return result;
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

    // Menandai semua notifikasi sebagai dibaca (Async)
    const markAllAsRead = async () => {
        try {
            setLoading(true);
            setError(null);

            // Menghitung jumlah notifikasi yang belum dibaca untuk pembaruan UI optimis
            const currentUnreadCount = notifications.filter(n => !n.read).length;

            // Update UI secara optimis
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);

            // Melakukan panggilan API untuk menandai semua sebagai dibaca
            await apiCall('/api/notifications/read-all', {
                method: 'PATCH'
            });

            console.log(`✅ All ${currentUnreadCount} notifications marked as read asynchronously`);
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);

            // Mengembalikan pembaruan UI jika terjadi kesalahan
            await fetchNotifications(); // Refresh dari server

            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Menghapus notifikasi (Async)
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

            console.log(`🗑️ Notification ${notificationId} deleted asynchronously`);
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

    // Request notification permissions (Async)
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                console.log(`🔔 Notification permission: ${permission}`);
                return permission === 'granted';
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                return false;
            }
        }
        return false;
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

    // ASYNC POLLING SETUP - This is where the real async magic happens
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            console.log('No auth token found, skipping notification fetch');
            return;
        }

        console.log('🚀 Setting up asynchronous notification system...');

        // Request notification permission
        requestNotificationPermission();

        // Initial load
        fetchUnreadCount().catch(console.error);

        // Set up async polling with exponential backoff
        let pollInterval = 5000; // Start with 5 seconds
        const maxInterval = 30000; // Max 30 seconds
        const minInterval = 5000; // Min 5 seconds

        let intervalId;

        const startAsyncPolling = () => {
            intervalId = setInterval(async () => {
                try {
                    console.log(`🔄 Async polling for notifications... (interval: ${pollInterval}ms)`);
                    await checkForNewNotifications();

                    // Reduce polling frequency if no new notifications
                    if (pollInterval < maxInterval) {
                        pollInterval = Math.min(pollInterval * 1.2, maxInterval);
                    }
                } catch (error) {
                    console.error('Error in async polling:', error);

                    // Increase polling frequency on error (but not below minimum)
                    pollInterval = Math.max(pollInterval * 0.8, minInterval);
                }
            }, pollInterval);
        };

        // Start polling
        startAsyncPolling();

        // Listen for focus events to refresh immediately
        const handleFocus = () => {
            console.log('🎯 Window focused - refreshing notifications asynchronously');
            checkForNewNotifications();
            pollInterval = minInterval; // Reset to fast polling
        };

        // Listen for visibility change to adjust polling
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('👁️ Page hidden - reducing polling frequency');
                pollInterval = maxInterval;
            } else {
                console.log('👁️ Page visible - increasing polling frequency');
                pollInterval = minInterval;
                checkForNewNotifications();
            }
        };

        // Add event listeners
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up async notification system');
            if (intervalId) {
                clearInterval(intervalId);
            }
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // Empty dependency array for setup only

    // Context value yang akan dipakai oleh komponen lain
    const value = {
        // State
        notifications,
        unreadCount,
        loading,
        error,
        isPolling,
        lastPollingTime,

        // Async functions
        fetchNotifications,
        fetchUnreadNotifications,
        fetchUnreadCount,
        checkForNewNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        requestNotificationPermission,

        // Utility functions
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