'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function OrganizerLayout({ children }) {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            
            if (user.role !== 'ORGANIZER') {
                router.push('/login');
                return;
            }
        }
    }, [user, router, authLoading, mounted]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const handleCreateEvent = () => {
        router.push('/events/create');
    };

    const topNavigationItems = [
        { id: 'events', label: 'Available Events', icon: '🎟️', href: '/events' },
        { id: 'my-events', label: 'My Events', icon: '🎪', href: '/events/my-events' },
        { id: 'create-event', label: 'Create Event', icon: '➕', href: '/events/create' }
    ];

    const bottomNavigationItems = [
        { id: 'ratings', label: 'Reviews & Ratings', icon: '⭐', href: '/ratings' },
        { id: 'reports', label: 'Support', icon: '🆘', href: '/reports' }
    ];

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'ORGANIZER') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/events" className="text-2xl font-bold text-gray-900 hover:text-green-600">
                                EventSphere
                            </Link>
                            <span className="ml-4 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                ORGANIZER
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Hi, {user?.fullName || user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="w-full max-w-6xl">
                            {/* Top Navigation - 3 Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                {topNavigationItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className="flex items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg hover:bg-green-600 hover:text-white transition duration-200"
                                    >
                                        <div className="text-center">
                                            <span className="text-3xl">{item.icon}</span>
                                            <p className="mt-2 text-lg font-medium">{item.label}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            
                            {/* Bottom Navigation - 3 Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {bottomNavigationItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className="flex items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg hover:bg-green-600 hover:text-white transition duration-200"
                                    >
                                        <div className="text-center">
                                            <span className="text-3xl">{item.icon}</span>
                                            <p className="mt-2 text-lg font-medium">{item.label}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}