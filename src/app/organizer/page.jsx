'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrganizerLayout({ children }) {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
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

    if (!user || user.role !== 'ORGANIZER') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                            <Link href="/organizer" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                                EventSphere
                            </Link>
                            <span className="ml-4 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
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

            {/* Action Buttons */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex gap-4">
                <Link
                    href="/organizer/addevent"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                    Add Event
                </Link>
                <Link
                    href="/organizer/tickets/ticketmanagement"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                >
                    Add Ticket
                </Link>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
