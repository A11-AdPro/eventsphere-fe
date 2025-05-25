'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Membuat context untuk laporan
const ReportContext = createContext();

// Hook untuk mengakses context laporan
export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportProvider');
    }
    return context;
};

// Penyedia context laporan untuk aplikasi
export const ReportProvider = ({ children }) => {
    const [reports, setReports] = useState([]); // Menyimpan data laporan
    const [selectedReport, setSelectedReport] = useState(null); // Menyimpan laporan yang dipilih
    const [loading, setLoading] = useState(false); // Status loading
    const [error, setError] = useState(null); // Menyimpan error jika ada

    const API_BASE_URL = 'http://localhost:8080'; // URL API untuk pengambilan data

    // Mendapatkan token autentikasi dari localStorage
    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return '';
    };

    // Menyusun header untuk autentikasi
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    // Fungsi umum untuk melakukan panggilan API
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

            // Menangani respons kosong (204 No Content)
            if (response.status === 204) {
                return null;
            }

            // Hanya parsing JSON jika content-type adalah application/json
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

    // Membuat laporan baru (Attendee)
    const createReport = async (reportData) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall('/api/attendee/reports', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });

            // Refresh laporan setelah pembuatan
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

    // Mengambil laporan pengguna (Attendee)
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

    // Mengambil laporan berdasarkan ID (Attendee)
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

    // Mengambil laporan berdasarkan ID (Admin)
    const fetchReportByIdAdmin = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/admin/reports/${reportId}`);
            setSelectedReport(data);

            return data;
        } catch (error) {
            console.error('Error fetching admin report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Menambahkan komentar pada laporan
    const addComment = async (reportId, message) => {
        try {
            setLoading(true);
            setError(null);

            const commentData = { message };
            const data = await apiCall(`/api/attendee/reports/${reportId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            // Refresh detail laporan untuk menampilkan komentar baru
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

    // Fungsi Admin: Mengambil semua laporan
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

    // Fungsi Admin: Memperbarui status laporan
    const updateReportStatus = async (reportId, status) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/admin/reports/${reportId}/status?status=${status}`, {
                method: 'PATCH'
            });

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

    // Fungsi Admin: Menambahkan komentar pada laporan
    const addAdminComment = async (reportId, message) => {
        try {
            setLoading(true);
            setError(null);

            const commentData = {
                message
            };

            const data = await apiCall(`/api/admin/reports/${reportId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            // Refresh laporan yang dipilih untuk memperbarui komentar
            if (selectedReport?.id === reportId) {
                await fetchReportByIdAdmin(reportId);
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

    // Fungsi Admin: Menghapus laporan
    const deleteReport = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            await apiCall(`/api/admin/reports/${reportId}`, {
                method: 'DELETE'
            });

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

    // Fungsi Organizer: Mengambil laporan organizer
    const fetchOrganizerReports = async (status = null) => {
        try {
            setError(null);
            let url = '/api/organizer/reports';
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
            console.error('Error fetching organizer reports:', error);
            setError(error.message);
            setReports([]);
            throw error;
        }
    };

    // Fungsi Organizer: Mengambil laporan berdasarkan ID
    const fetchReportByIdOrganizer = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/organizer/reports/${reportId}`);
            setSelectedReport(data);

            return data;
        } catch (error) {
            console.error('Error fetching organizer report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Fungsi Organizer: Menambahkan komentar pada laporan
    const addOrganizerComment = async (reportId, message) => {
        try {
            setLoading(true);
            setError(null);

            const commentData = {
                message
            };

            const data = await apiCall(`/api/organizer/reports/${reportId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });

            // Refresh laporan yang dipilih untuk menampilkan komentar baru
            if (selectedReport?.id === reportId) {
                await fetchReportByIdOrganizer(reportId);
            }

            return data;
        } catch (error) {
            console.error('Error adding organizer comment:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Fungsi Organizer: Memperbarui status laporan
    const updateOrganizerReportStatus = async (reportId, status) => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiCall(`/api/organizer/reports/${reportId}/status?status=${status}`, {
                method: 'PATCH'
            });

            await fetchOrganizerReports();

            return data;
        } catch (error) {
            console.error('Error updating organizer report status:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Fungsi Organizer: Menghapus laporan
    const deleteOrganizerReport = async (reportId) => {
        try {
            setLoading(true);
            setError(null);

            await apiCall(`/api/organizer/reports/${reportId}`, {
                method: 'DELETE'
            });

            await fetchOrganizerReports();

            return true;
        } catch (error) {
            console.error('Error deleting organizer report:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Utility: Menampilkan kategori laporan
    const getReportCategoryDisplay = (category) => {
        switch (category) {
            case 'PAYMENT': return 'Payment Issue';
            case 'TICKET': return 'Ticket Issue';
            case 'EVENT': return 'Event Issue';
            case 'OTHER': return 'Other Issue';
            default: return category;
        }
    };

    // Utility: Menampilkan status laporan
    const getReportStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING': return 'Pending';
            case 'ON_PROGRESS': return 'On Progress';
            case 'RESOLVED': return 'Resolved';
            default: return status;
        }
    };

    // Utility: Mengubah warna status
    const getStatusColorClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ON_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Utility: Mengubah warna kategori
    const getCategoryColorClass = (category) => {
        switch (category) {
            case 'PAYMENT': return 'bg-red-100 text-red-800 border-red-200';
            case 'TICKET': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'EVENT': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'OTHER': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Utility: Format tanggal
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
    }
    }, []);

    const value = {
        reports,
        selectedReport,
        loading,
        error,
        // Fungsi Attendee
        createReport,
        fetchMyReports,
        fetchReportById,
        addComment,

        // Fungsi Admin
        fetchAllReports,
        fetchReportByIdAdmin,
        updateReportStatus,
        addAdminComment,
        deleteReport,

        // Fungsi Organizer
        fetchOrganizerReports,
        fetchReportByIdOrganizer,
        addOrganizerComment,
        updateOrganizerReportStatus,
        deleteOrganizerReport,

        // Fungsi Utilitas
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
