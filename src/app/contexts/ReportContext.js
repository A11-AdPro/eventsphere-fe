'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ReportContext = createContext();

export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportProvider');
    }
    return context;
};

export const ReportProvider = ({ children }) => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CHANGE THIS LINE WHEN DEPLOYING
    // Development: 'http://localhost:8080'
    // Production:  'http://34.193.71.203'
    const API_BASE_URL = 'http://localhost:8080';

    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return '';
    };

    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const apiCall = async (url, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) errorMessage = errorText;
                }
                throw new Error(errorMessage);
            }

            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return null;
            }

            // Only parse JSON if content-type is application/json
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    };
    // Create a new report (Attendee)
    const createReport = async (reportData) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall('/api/attendee/reports', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });

            // Refresh reports after creation
            await fetchMyReports();

            return data;
        } catch (error) {
            console.error('Error creating report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get my reports (Attendee)
    const fetchMyReports = async () => {
        try {
            setError(null);
            const data = await apiCall('/api/attendee/reports');

            if (Array.isArray(data)) {
                setReports(data);
            } else {
                setReports([]);
            }

            return data;
        } catch (error) {
            console.error('Error fetching my reports:', error);
            setError(error.message);
            setReports([]);
            throw error;
        }
    };

    // Get report by ID (Attendee)
    const fetchReportById = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/attendee/reports/${reportId}`);
            setSelectedReport(data);

            return data;
        } catch (error) {
            console.error('Error fetching report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Add comment to report
    const addComment = async (reportId, message) => {
        try {
            setLoading(true);
            setError(null);

            const commentData = { message };
            const data = await apiCall(`/api/attendee/reports/${reportId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            // Refresh report details to show new comment
            await fetchReportById(reportId);

            return data;
        } catch (error) {
            console.error('Error adding comment:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Admin functions
    const fetchAllReports = async (status = null) => {
        try {
            setError(null);
            let url = '/api/admin/reports';
            if (status) {
                url += `?status=${status}`;
            }

            const data = await apiCall(url);

            if (Array.isArray(data)) {
                setReports(data);
            } else {
                setReports([]);
            }

            return data;
        } catch (error) {
            console.error('Error fetching all reports:', error);
            setError(error.message);
            setReports([]);
            throw error;
        }
    };

    // Update report status (Admin/Organizer)
    const updateReportStatus = async (reportId, status) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/admin/reports/${reportId}/status?status=${status}`, {
                method: 'PATCH'
            });

            // Refresh reports list
            await fetchAllReports();

            return data;
        } catch (error) {
            console.error('Error updating report status:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Admin add comment
    const addAdminComment = async (reportId, message) => {
        try {
            setLoading(true);
            setError(null);

            const commentData = {
                message,
                responderRole: 'ADMIN' // Explicitly set role
            };

            const data = await apiCall(`/api/admin/reports/${reportId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            // Refresh both the reports list and selected report
            await fetchAllReports();
            if (selectedReport?.id === reportId) {
                await fetchReportById(reportId);
            }

            return data;
        } catch (error) {
            console.error('Error adding admin comment:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Delete report (Admin)
    const deleteReport = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            await apiCall(`/api/admin/reports/${reportId}`, {
                method: 'DELETE'
            });

            // Refresh reports list
            await fetchAllReports();

            return true;
        } catch (error) {
            console.error('Error deleting report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Utility functions
    const getReportCategoryDisplay = (category) => {
        switch (category) {
            case 'PAYMENT':
                return 'Payment Issue';
            case 'TICKET':
                return 'Ticket Issue';
            case 'EVENT':
                return 'Event Issue';
            case 'OTHER':
                return 'Other Issue';
            default:
                return category;
        }
    };

    const getReportStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'ON_PROGRESS':
                return 'On Progress';
            case 'RESOLVED':
                return 'Resolved';
            default:
                return status;
        }
    };

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ON_PROGRESS':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'RESOLVED':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryColorClass = (category) => {
        switch (category) {
            case 'PAYMENT':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'TICKET':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'EVENT':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'OTHER':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            return new Date(dateString).toLocaleString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Load initial data
    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            // Don't auto-load reports on mount, let components decide when to load
        }
    }, []);

    const value = {
        reports,
        selectedReport,
        loading,
        error,
        createReport,
        fetchMyReports,
        fetchReportById,
        addComment,
        fetchAllReports,
        updateReportStatus,
        addAdminComment,
        deleteReport,
        getReportCategoryDisplay,
        getReportStatusDisplay,
        getStatusColorClass,
        getCategoryColorClass,
        formatDate,
        setError,
        setSelectedReport,
    };

    return (
        <ReportContext.Provider value={value}>
            {children}
        </ReportContext.Provider>
    );
};