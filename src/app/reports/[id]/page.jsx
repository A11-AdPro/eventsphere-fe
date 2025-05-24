'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Send, Clock, CheckCircle, AlertCircle, FileText, User } from 'lucide-react';

export default function ReportDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const reportId = params.id;

    const {
        selectedReport,
        loading,
        error,
        fetchReportById,
        addComment,
        getReportCategoryDisplay,
        getReportStatusDisplay,
        getStatusColorClass,
        getCategoryColorClass,
        formatDate,
        setError
    } = useReports();

    const [mounted, setMounted] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentError, setCommentError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

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

            if (reportId) {
                fetchReportById(reportId).catch(console.error);
            }
        }
    }, [user, router, authLoading, mounted, reportId]);

    const handleBack = () => {
        router.push('/reports');
    };

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

            await addComment(reportId, newComment.trim());
            setNewComment('');
        } catch (err) {
            setCommentError(err.message || 'Failed to add comment');
        } finally {
            setCommentLoading(false);
        }
    };

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

    if (!mounted || authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'ATTENDEE') {
        return null;
    }

    if (error || !selectedReport) {
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Reports
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Report Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColorClass(selectedReport.status)}`}>
                                {getStatusIcon(selectedReport.status)}
                                <span>{getReportStatusDisplay(selectedReport.status)}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColorClass(selectedReport.category)}`}>
                {getReportCategoryDisplay(selectedReport.category)}
              </span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Report ID: {selectedReport.id}
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {getReportCategoryDisplay(selectedReport.category)}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                            <strong>Created:</strong> {formatDate(selectedReport.createdAt)}
                        </div>
                        {selectedReport.updatedAt && (
                            <div>
                                <strong>Last Updated:</strong> {formatDate(selectedReport.updatedAt)}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Comments ({selectedReport.comments?.length || 0})
                    </h2>

                    {/* Comments List */}
                    <div className="space-y-4 mb-6">
                        {selectedReport.comments && selectedReport.comments.length > 0 ? (
                            selectedReport.comments.map((comment) => (
                                <div key={comment.id} className="border rounded-lg p-4">
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

                    {/* Add Comment Form */}
                    {selectedReport.status !== 'RESOLVED' && (
                        <form onSubmit={handleAddComment} className="border-t pt-6">
                            <h3 className="font-medium text-gray-900 mb-3">Add a comment</h3>

                            {commentError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {commentError}
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                  <textarea
                      value={newComment}
                      onChange={(e) => {
                          setNewComment(e.target.value);
                          setCommentError('');
                      }}
                      placeholder="Add additional information or ask a question..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                                    <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {newComment.length}/500 characters
                    </span>
                                        <button
                                            type="submit"
                                            disabled={commentLoading || !newComment.trim() || newComment.length > 500}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {commentLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Post Comment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {selectedReport.status === 'RESOLVED' && (
                        <div className="border-t pt-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                                <div>
                                    <p className="text-green-800 font-medium">This report has been resolved</p>
                                    <p className="text-green-700 text-sm">No further comments can be added.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}