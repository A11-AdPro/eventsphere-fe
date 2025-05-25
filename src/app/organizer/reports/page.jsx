'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import { useRouter } from 'next/navigation';
import { Filter, Search, Eye, Trash2, MessageCircle, Clock, CheckCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';

export default function OrganizerReportsPage() {
    const { user, loading: authLoading, isOrganizer } = useAuth();
    const router = useRouter();
    const {
        reports,
        loading,
        error,
        fetchOrganizerReports,
        updateOrganizerReportStatus,
        deleteOrganizerReport,
        getReportCategoryDisplay,
        getStatusColorClass,
        getCategoryColorClass,
        formatDate
    } = useReports();

    const [mounted, setMounted] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredReports, setFilteredReports] = useState([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user || !isOrganizer()) {
                router.push('/login');
                return;
            }

            fetchOrganizerReports().catch(console.error);
        }
    }, [user, router, authLoading, mounted, isOrganizer]);

    // Filter reports based on status and search term
    useEffect(() => {
        let filtered = reports;

        if (selectedStatus) {
            filtered = filtered.filter(report => report.status === selectedStatus);
        }

        if (searchTerm) {
            filtered = filtered.filter(report =>
                report.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getReportCategoryDisplay(report.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredReports(filtered);
    }, [reports, selectedStatus, searchTerm]);

    const handleStatusChange = async (reportId, newStatus) => {
        try {
            await updateOrganizerReportStatus(reportId, newStatus);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update report status. Please try again.');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            try {
                await deleteOrganizerReport(reportId);
            } catch (err) {
                console.error('Error deleting report:', err);
                alert('Failed to delete report. Please try again.');
            }
        }
    };

    const handleViewReport = (reportId) => {
        router.push(`/organizer/reports/${reportId}`);
    };
    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !isOrganizer()) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title="Reports Management"
                subtitle="Manage user reports related to your events"
                actions={[
                    {
                        label: 'Back to Dashboard',
                        onClick: () => router.push('/organizer'),
                        className: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center',
                        icon: <ArrowLeft className="w-4 h-4 mr-2" />
                    }
                ]}
            />

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Info Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Organizer Access:</strong> You can view, respond to, update status, and delete reports related to your events.
                                You have full control over reports for events you organize.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                                        <dd className="text-lg font-medium text-gray-900">{reports.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-yellow-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {reports.filter(r => r.status === 'PENDING').length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {reports.filter(r => r.status === 'ON_PROGRESS').length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {reports.filter(r => r.status === 'RESOLVED').length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="ON_PROGRESS">On Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by user email, description, event, or category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Reports ({filteredReports.length})
                        </h3>
                    </div>

                    {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {reports.length === 0 ? 'No reports have been created yet.' : 'Try adjusting your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User & Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Comments
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {report.userEmail}
                                                </div>
                                                <div className="mt-1 flex items-center space-x-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColorClass(report.category)}`}>
                                                        {getReportCategoryDisplay(report.category)}
                                                    </span>
                                                    {/* Event Badge */}
                                                    {report.eventId && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                                            Event
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Event Title */}
                                                {report.eventTitle && (
                                                    <div className="text-xs text-purple-600 mt-1">
                                                        Event: {report.eventTitle}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {report.shortDescription || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={report.status}
                                                onChange={(e) => handleStatusChange(report.id, e.target.value)}
                                                className={`text-xs font-medium rounded-full border px-2 py-1 ${getStatusColorClass(report.status)} focus:outline-none focus:ring-2 focus:ring-green-500`}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="ON_PROGRESS">On Progress</option>
                                                <option value="RESOLVED">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(report.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MessageCircle className="w-4 h-4 mr-1" />
                                                {report.commentCount || 0}
                                            </div>
                                        </td>
                                        {/* FIXED: Added delete button back with context function */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewReport(report.id)}
                                                    className="text-green-600 hover:text-green-900 p-1"
                                                    title="View Details & Respond"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {/* Delete Button for Event Reports */}
                                                {report.eventId && (
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete Report"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

                {/* Quick Actions */}
                <div className="mt-8 bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setSelectedStatus('PENDING')}
                            className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition duration-200"
                        >
                            <Clock className="w-5 h-5 mr-2" />
                            View Pending Reports
                        </button>
                        <button
                            onClick={() => setSelectedStatus('ON_PROGRESS')}
                            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                        >
                            <AlertCircle className="w-5 h-5 mr-2" />
                            View In Progress
                        </button>
                        <button
                            onClick={() => router.push('/organizer')}
                            className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}