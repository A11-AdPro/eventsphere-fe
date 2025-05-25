'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

export default function Header({ title, subtitle, actions = [] }) {
    const { user, logout } = useAuth();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getNotificationColor,
        formatDate
    } = useNotifications();

    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoaded, setNotificationsLoaded] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const notificationRef = useRef(null);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNotificationClick = async () => {
        setShowNotifications(!showNotifications);

        // Load notifications when first opened
        if (!notificationsLoaded && !showNotifications) {
            try {
                await fetchNotifications();
                setNotificationsLoaded(true);
            } catch (error) {
                console.error('Failed to load notifications:', error);
            }
        }
    };

    const handleMarkAsRead = async (notificationId, event) => {
        event.stopPropagation();
        if (actionLoading === notificationId) return;

        try {
            setActionLoading(notificationId);
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (actionLoading === 'markAll') return;

        try {
            setActionLoading('markAll');
            await markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteNotification = async (notificationId, event) => {
        event.stopPropagation();
        if (actionLoading === notificationId) return;

        try {
            setActionLoading(notificationId);
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleNotificationItemClick = async (notification) => {
        // Don't navigate if an action button is loading
        if (actionLoading) return;

        // Mark as read if unread
        if (!notification.read) {
            await handleMarkAsRead(notification.id, { stopPropagation: () => {} });
        }

        // Navigate based on notification type
        if (notification.type === 'NEW_REPORT' || notification.type === 'STATUS_UPDATE' || notification.type === 'NEW_RESPONSE') {
            if (notification.relatedEntityId) {
                // Close notification dropdown
                setShowNotifications(false);

                // Navigate based on user role
                if (user?.role === 'ADMIN') {
                    window.location.href = `/admin/reports/${notification.relatedEntityId}`;
                } else if (user?.role === 'ATTENDEE') {
                    window.location.href = `/reports/${notification.relatedEntityId}`;
                }
            }
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'ORGANIZER':
                return 'bg-green-100 text-green-800';
            case 'ATTENDEE':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                            EventSphere
                        </Link>
                        {user?.role && (
                            <span className={`ml-4 px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                            </span>
                        )}
                        {subtitle && (
                            <span className="ml-4 text-sm text-gray-500">{subtitle}</span>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Custom actions */}
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={action.className || "bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"}
                            >
                                {action.icon && action.icon}
                                {action.label}
                            </button>
                        ))}

                        {/* Notifications */}
                        {user && (
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                                >
                                    <Bell className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllAsRead}
                                                        disabled={actionLoading === 'markAll'}
                                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
                                                    >
                                                        {actionLoading === 'markAll' ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                                                        ) : (
                                                            <CheckCheck className="w-4 h-4 mr-1" />
                                                        )}
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {loading && notifications.length === 0 ? (
                                                <div className="p-4 text-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                    <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500">No notifications yet</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-200">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                                !notification.read ? 'bg-blue-50' : ''
                                                            } ${actionLoading ? 'pointer-events-none' : ''}`}
                                                            onClick={() => handleNotificationItemClick(notification)}
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <div className="flex-shrink-0">
                                                                    <span className="text-lg">
                                                                        {getNotificationIcon(notification.type)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className={`text-sm font-medium ${
                                                                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                                                                        }`}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        <div className="flex items-center space-x-1">
                                                                            {!notification.read && (
                                                                                <button
                                                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                                                    disabled={actionLoading === notification.id}
                                                                                    className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                                                                                    title="Mark as read"
                                                                                >
                                                                                    {actionLoading === notification.id ? (
                                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                                                    ) : (
                                                                                        <Check className="w-3 h-3" />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                                                disabled={actionLoading === notification.id}
                                                                                className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                                                                                title="Delete"
                                                                            >
                                                                                {actionLoading === notification.id ? (
                                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                                                                ) : (
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        {truncateText(notification.message, 80)}
                                                                    </p>
                                                                    <div className="flex items-center justify-between mt-2">
                                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getNotificationColor(notification.type)}`}>
                                                                            {notification.type.replace('_', ' ')}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {formatDate(notification.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {!notification.read && (
                                                                    <div className="flex-shrink-0">
                                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {notifications.length > 0 && (
                                            <div className="p-3 border-t border-gray-200 bg-gray-50">
                                                <Link
                                                    href="/notifications"
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    onClick={() => setShowNotifications(false)}
                                                >
                                                    View all notifications →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User info and logout */}
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">
                                Hi, {user?.fullName || user?.email}
                            </span>
                            <button
                                onClick={logout}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page title section */}
            {title && (
                <div className="bg-gray-50 border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        {subtitle && (
                            <p className="text-gray-600 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}