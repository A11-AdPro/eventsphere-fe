'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Filter, Search } from 'lucide-react';
import Header from '../components/Header';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
        formatDate
    } = useNotifications();

    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [typeFilter, setTypeFilter] = useState(''); // '', 'NEW_REPORT', 'STATUS_UPDATE', 'NEW_RESPONSE'
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredNotifications, setFilteredNotifications] = useState([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            // Load notifications
            fetchNotifications().catch(console.error);
        }
    }, [user, router, authLoading, mounted]);

    // Filter notifications
    useEffect(() => {
        let filtered = notifications;

        // Filter by read status
        if (filter === 'unread') {
            filtered = filtered.filter(n => !n.read);
        } else if (filter === 'read') {
            filtered = filtered.filter(n => n.read);
        }

        // Filter by type
        if (typeFilter) {
            filtered = filtered.filter(n => n.type === typeFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredNotifications(filtered);
    }, [notifications, filter, typeFilter, searchTerm]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate based on notification type
        if (notification.type === 'NEW_REPORT' || notification.type === 'STATUS_UPDATE' || notification.type === 'NEW_RESPONSE') {
            if (notification.relatedEntityId) {
                if (user?.role === 'ADMIN') {
                    router.push(`/admin/reports/${notification.relatedEntityId}`);
                } else if (user?.role === 'ATTENDEE') {
                    router.push(`/reports/${notification.relatedEntityId}`);
                }
            }
        }
    };

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title="Notifications"
                subtitle={`${unreadCount} unread notifications`}
                actions={unreadCount > 0 ? [
                    {
                        label: 'Mark All Read',
                        onClick: handleMarkAllAsRead,
                        className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center',
                        icon: <CheckCheck className="w-4 h-4 mr-2" />
                    }
                ] : []}
            />

            <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Notifications</option>
                                    <option value="unread">Unread Only</option>
                                    <option value="read">Read Only</option>
                                </select>
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="NEW_REPORT">New Reports</option>
                                <option value="STATUS_UPDATE">Status Updates</option>
                                <option value="NEW_RESPONSE">New Responses</option>
                            </select>
                        </div>

                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Notifications ({filteredNotifications.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
                            </h3>
                            <p className="text-gray-500">
                                {notifications.length === 0
                                    ? 'You\'ll receive notifications here when there are updates to your reports or new activity.'
                                    : 'Try adjusting your filters to see more notifications.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                                !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className={`text-base font-medium ${
                                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                    {notification.title}
                                                </h4>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getNotificationColor(notification.type)}`}>
                                                        {notification.type.replace('_', ' ')}
                                                    </span>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                    <span>From: {notification.senderRole}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(notification.createdAt)}</span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteNotification(notification.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                                                        title="Delete notification"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                {notifications.length > 0 && (
                    <div className="mt-6 bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                    className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition duration-200"
                                >
                                    <CheckCheck className="w-5 h-5 mr-2" />
                                    Mark All as Read ({unreadCount})
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/reports')}
                                className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
                            >
                                <Bell className="w-5 h-5 mr-2" />
                                Go to Reports
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}