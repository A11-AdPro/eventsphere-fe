'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MessageCircle, Clock, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import Header from '../components/Header';

export default function ReportsPage() {
    // Mengambil data autentikasi pengguna
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Mengambil data laporan dan fungsi dari context
    const {
        reports,
        loading,
        error,
        fetchMyReports,
        getReportCategoryDisplay,
        getReportStatusDisplay,
        getStatusColorClass,
        getCategoryColorClass,
        formatDate
    } = useReports();

    const [mounted, setMounted] = useState(false);

    // Effect untuk menandai komponen telah dimuat
    useEffect(() => {
        setMounted(true);
    }, []);

    // Effect untuk memeriksa autentikasi pengguna dan mengambil laporan
    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            if (user.role !== 'ATTENDEE') {
                router.push('/login');
                return;
            }

            fetchMyReports().catch(console.error);
        }
    }, [user, router, authLoading, mounted]);

    // Fungsi untuk mengarahkan ke halaman pembuatan laporan
    const handleCreateReport = () => {
        router.push('/reports/create');
    };

    // Fungsi untuk melihat detail laporan
    const handleViewReport = (reportId) => {
        router.push(`/reports/${reportId}`);
    };

    // Menampilkan loading jika data belum siap
    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Menangani jika user tidak memiliki akses
    if (!user || user.role !== 'ATTENDEE') {
        return null;
    }

    // Menentukan ikon status laporan
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-5 h-5" />;
            case 'ON_PROGRESS':
                return <AlertCircle className="w-5 h-5" />;
            case 'RESOLVED':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header dengan tombol aksi */}
            <Header
                title="Reports"
                subtitle="Get help with your issues"
                actions={[
                    {
                        label: 'Create Report',
                        onClick: handleCreateReport,
                        className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center',
                        icon: <Plus className="w-4 h-4 mr-2" />
                    }
                ]}
            />

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Reports */}
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

                    {/* Pending Reports */}
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

                    {/* In Progress Reports */}
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

                    {/* Resolved Reports */}
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

                {/* Reports List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Reports</h3>

                        {reports.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating your first support report.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={handleCreateReport}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                                        Create Report
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleViewReport(report.id)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(report.status)}`}>
                                                    {getStatusIcon(report.status)}
                                                    <span>{getReportStatusDisplay(report.status)}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColorClass(report.category)}`}>
                                                    {getReportCategoryDisplay(report.category)}
                                                </span>
                                                {/* Event Badge */}
                                                {report.eventId && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        Event
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <MessageCircle className="w-4 h-4 mr-1" />
                                                {report.commentCount || 0}
                                            </div>
                                        </div>

                                        <h4 className="font-medium text-gray-900 mb-1">
                                            {report.shortDescription || 'Report'}
                                        </h4>

                                        {/* Event Title */}
                                        {report.eventTitle && (
                                            <div className="flex items-center mb-2">
                                                <Calendar className="w-4 h-4 text-purple-600 mr-1" />
                                                <p className="text-sm text-purple-600 font-medium">
                                                    Event: {report.eventTitle}
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-600">
                                            Created: {formatDate(report.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleCreateReport}
                            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Report
                        </button>
                        <Link
                            href="/events"
                            className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
                        >
                            <FileText className="w-5 h-5 mr-2" />
                            Back to Events
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
