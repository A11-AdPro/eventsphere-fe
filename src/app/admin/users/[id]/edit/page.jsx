'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAdminUser } from '../../../../contexts/AdminUserContext';
import { useRouter, useParams } from 'next/navigation';

export default function AdminEditUserPage() {
    const { user, isAdmin, checkAuthStatus } = useAuth();
    const { getUserById, updateUser, loading, error, clearError } = useAdminUser();
    const router = useRouter();
    const params = useParams();
    const userId = params.id;

    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'ATTENDEE',
        balance: 0,
        password: ''
    });
    const [success, setSuccess] = useState('');
    const [isCurrentUser, setIsCurrentUser] = useState(false);

    useEffect(() => {
        if (!user || !isAdmin()) {
            router.push('/login');
            return;
        }
        
        fetchUserData();
    }, [user, isAdmin, router, userId]);

    const fetchUserData = async () => {
        try {
            const result = await getUserById(userId);
            if (result.success) {
                setUserData(result.data);
                setFormData({
                    email: result.data.email,
                    fullName: result.data.fullName || '',
                    role: result.data.role,
                    balance: result.data.balance || 0,
                    password: ''
                });
                setIsCurrentUser(result.data.id === user.id);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setSuccess('');

        const updateData = {};
        
        if (formData.email && formData.email !== userData.email) {
            updateData.email = formData.email;
        }
        
        if (formData.fullName && formData.fullName !== userData.fullName) {
            updateData.fullName = formData.fullName;
        }
        
        if (formData.role !== userData.role) {
            updateData.role = formData.role;
        }
        
        if (formData.balance !== userData.balance) {
            updateData.balance = formData.balance;
        }
        
        if (formData.password) {
            updateData.password = formData.password;
        }

        if (Object.keys(updateData).length === 0) {
            setSuccess('No changes to update');
            return;
        }

        const result = await updateUser(userId, updateData);
        
        if (result.success) {
            setSuccess(result.message);
            setUserData(result.data);
            setFormData(prev => ({ ...prev, password: '' }));
            
            if (isCurrentUser) {
                checkAuthStatus();
            }
        }
    };

    if (!user || !isAdmin()) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin/users')}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Back to Users
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Edit User {isCurrentUser && '(Your Profile)'}
                    </h1>
                    <p className="text-gray-600 mt-1">Update user information and settings</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-red-600">{error}</p>
                                <button
                                    onClick={clearError}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>                       

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password (leave blank to keep current)
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new password"
                            />
                        </div>

                        {/* User Info Display */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">User Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">User ID:</span>
                                    <span className="ml-2 font-mono">{userData.id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Created:</span>
                                    <span className="ml-2">{new Date(userData.createdAt).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Last Updated:</span>
                                    <span className="ml-2">{new Date(userData.updatedAt).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Current Role:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                        userData.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                        userData.role === 'ORGANIZER' ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {userData.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/users')}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                            >
                                {loading ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}