'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminUser } from '../../contexts/AdminUserContext';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const { user, isAdmin } = useAuth();
    const { 
        users, 
        loading, 
        error, 
        getAllUsers, 
        deleteUser, 
        getUsersByRole,
        clearError 
    } = useAdminUser();
    const router = useRouter();

    const [selectedRole, setSelectedRole] = useState('ALL');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        if (!user || !isAdmin()) {
            router.push('/login');
            return;
        }
        getAllUsers();
    }, [user, isAdmin, router, getAllUsers]);

    useEffect(() => {
        let filtered = users;

        if (selectedRole !== 'ALL') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [users, selectedRole, searchTerm]);

    const handleRoleFilter = async (role) => {
        setSelectedRole(role);
        if (role === 'ALL') {
            getAllUsers();
        } else {
            const result = await getUsersByRole(role);
            if (result.success) {
                setFilteredUsers(result.data);
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        const result = await deleteUser(userId);
        if (result.success) {
            setShowDeleteModal(false);
            setUserToDelete(null);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID');
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <button
                                onClick={() => router.push('/admin')}
                                className="text-blue-600 hover:text-blue-800 mr-4"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 inline">User Management</h1>
                        </div>
                        <button
                            onClick={() => router.push('/admin/register')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            Add New User
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Error Display */}
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

                {/* Filters and Search */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Role Filter */}
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'ADMIN', 'ORGANIZER', 'ATTENDEE'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleFilter(role)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedRole === role
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search by email or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Users ({filteredUsers.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((userData) => (
                                        <tr key={userData.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {userData.fullName || 'No name'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {userData.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userData.role)}`}>
                                                    {userData.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(userData.balance)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(userData.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {/* Only show Edit button for the current user */}
                                                {userData.id === user.id && (
                                                <button
                                                    onClick={() => router.push(`/admin/users/${userData.id}/edit`)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                )}
                                                {/* Delete button remains hidden for the current user */}
                                                {userData.id !== user.id && (
                                                <button
                                                    onClick={() => {
                                                    setUserToDelete(userData);
                                                    setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                                )}
                                            </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete {userToDelete.fullName || userToDelete.email}?
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(userToDelete.id)}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}