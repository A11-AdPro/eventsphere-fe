'use client';

import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Redirect based on user role
                switch (user.role) {
                    case 'ADMIN':
                        router.push('/admin');
                        break;
                    case 'ORGANIZER':
                        router.push('/organizer');
                        break;
                    case 'ATTENDEE':
                        router.push('/attendee');
                        break;
                    default:
                        router.push('/dashboard');
                }
            } else {
                // Not logged in, redirect to login
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return null; // This will not be shown as user gets redirected
}