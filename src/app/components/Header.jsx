'use client';

import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Header({ title, subtitle, actions = [] }) {
    const { user, logout } = useAuth();

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
                                {action.label}
                            </button>
                        ))}
                        
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
    );
}