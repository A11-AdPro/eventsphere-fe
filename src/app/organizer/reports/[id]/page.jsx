'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useReports } from '@/app/contexts/ReportContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send, Clock, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';

export default function OrganizerReportDetailPage() {
    const { user, loading: authLoading, isOrganizer } = useAuth();
    const router = useRouter();
    const params = useParams();
    const reportId = params.id;

    const {
        selectedReport,
        loading,
        error,
        getReportCategoryDisplay,
        getReportStatusDisplay,
        getStatusColorClass,
        getCategoryColorClass,
        formatDate,
        setError,
        setSelectedReport
    } = useReports();

    const [mounted, setMounted] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Menandai komponen telah dimuat
    useEffect(() => {
        setMounted(true);
    }, []);

    // Memastikan user telah terautentikasi dan mengambil data laporan
    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user || !isOrganizer()) {
                router.push('/login');
                return;
            }

            if (reportId) {
                fetchOrganizerReport(reportId).catch(console.error);
            }
        }
    }, [user, router, authLoading, mounted, reportId, isOrganizer]);

    // Fungsi untuk mengambil laporan organizer berdasarkan ID
    const fetchOrganizerReport = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/organizer/reports/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report');
            }

            const data = await response.json();
            setReportData(data);
            setSelectedReport(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Fungsi untuk kembali ke halaman laporan organizer
    const handleBack = () => {
        router.push('/organizer/reports');
    };

    // Fungsi untuk menambahkan komentar pada laporan
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setCommentError('Please enter a comment');
            return;
        }

        if (newComment.trim().length < 5) {
            setCommentError('Comment must be at least 5 characters long');
            return;
        }

        try {
            setCommentLoading(true);
            setCommentError('');

            const response = await fetch(`http://localhost:8080/api/organizer/reports/${reportId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: newComment.trim() })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            setNewComment('');

            // Refresh the report data
            await fetchOrganizerReport(reportId);
        } catch (err) {
            setCommentError(err.message || 'Failed to add comment');
        } finally {
            setCommentLoading(false);
        }
    };

    // Fungsi untuk memperbarui status laporan
    const handleStatusUpdate = async (newStatus) => {
        try {
            setStatusUpdating(true);

            const response = await fetch(`http://localhost:8080/api/organizer/reports/${reportId}/status?status=${newStatus}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Refresh the report data
            await fetchOrganizerReport(reportId);
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status. Please try again.');
        } finally {
            setStatusUpdating(false);
        }
    };

    // Fungsi untuk mendapatkan ikon status laporan
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

    // Fungsi untuk mendapatkan ikon peran
    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN':
                return '👑';
            case 'ORGANIZER':
                return '🎯';
            case 'ATTENDEE':
                return '👤';
            default:
                return '🤖';
        }
    };

    // Fungsi untuk mendapatkan warna peran
    const getRoleColor = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'ORGANIZER':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'ATTENDEE':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'SYSTEM':
                return 'text-purple-600 bg-purple-50 border-purple-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Loading screen ketika data belum siap
    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    // Jika user tidak punya akses
    if (!user || !isOrganizer()) {
        return null;
    }

    const currentReport = reportData || selectedReport;

    // Jika laporan tidak ditemukan atau error
    if (error || !currentReport) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto px-4">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        {error || "The report you're looking for doesn't exist or you don't have permission to view it."}
                    </p>
                    <button
                        onClick={handleBack}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                        Back to Reports
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Reports
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Report Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColorClass(currentReport.status)}`}>
                                {getStatusIcon(currentReport.status)}
                                <span>{getReportStatusDisplay(currentReport.status)}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColorClass(currentReport.category)}`}>
                                {getReportCategoryDisplay(currentReport.category)}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Report ID: {currentReport.id}
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {getReportCategoryDisplay(currentReport.category)} - {currentReport.userEmail}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
                        <div>
                            <strong>User:</strong> {currentReport.userEmail}
                        </div>
                        <div>
                            <strong>Created:</strong> {formatDate(currentReport.createdAt)}
                        </div>
                        {currentReport.updatedAt && (
                            <div>
                                <strong>Last Updated:</strong> {formatDate(currentReport.updatedAt)}
                            </div>
                        )}
                    </div>

                    {/* Status Update Section */}
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                            <span className="text-lg mr-2">🎯</span>
                            Update Report Status
                        </h3>
                        <div className="flex space-x-2">
                            {['PENDING', 'ON_PROGRESS', 'RESOLVED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(status)}
                                    disabled={statusUpdating || currentReport.status === status}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentReport.status === status
                                        ? 'bg-green-600 text-white cursor-default'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'} disabled:opacity-50`}
                                >
                                    {statusUpdating ? 'Updating...' : getReportStatusDisplay(status)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{currentReport.description}</p>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Comments ({currentReport.comments?.length || 0})
                    </h2>

                    {/* Comments List */}
                    <div className="space-y-4 mb-6">
                        {currentReport.comments && currentReport.comments.length > 0 ? (
                            currentReport.comments.map((comment) => (
                                <div key={comment.id} className={`border rounded-lg p-4 ${comment.responderRole === 'ORGANIZER' ? 'bg-green-50 border-green-200' : ''}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getRoleIcon(comment.responderRole)}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(comment.responderRole)}`}>
                                                {comment.responderRole}
                                            </span>
                                            {comment.responderEmail && (
                                                <span className="text-sm text-gray-600">
                                                    {comment.responderEmail}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No comments yet</p>
                            </div>
                        )}
                    </div>

                    {/* Add Organizer Comment Form */}
                    <form onSubmit={handleAddComment} className="border-t pt-6">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                            <span className="text-lg mr-2">🎯</span>
                            Add Organizer Response
                        </h3>

                        {commentError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {commentError}
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => {
                                        setNewComment(e.target.value);
                                        setCommentError('');
                                    }}
                                    placeholder="Provide a response to help resolve this user's issue..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm text-gray-500">
                                        {newComment.length}/500 characters
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={commentLoading || !newComment.trim() || newComment.length > 500}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {commentLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Posting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Post Response
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
