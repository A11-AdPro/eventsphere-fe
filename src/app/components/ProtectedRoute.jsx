'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole = null, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }

            if (requiredRole && user.role !== requiredRole) {
                router.push('/login');
                return;
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                router.push('/login');
                return;
            }
        }
    }, [user, loading, router, requiredRole, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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

    if (requiredRole && user.role !== requiredRole) {
        return null; 
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return null; 
    }

    return children;
}