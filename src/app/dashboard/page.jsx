'use client';

import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <p className="mb-2">Welcome, {user.fullName || user.email}!</p>
                <p className="mb-4">Role: {user.role}</p>
                <button 
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}