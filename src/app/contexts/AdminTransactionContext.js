'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const AdminTransactionContext = createContext();

export const useAdminTransaction = () => {
    const context = useContext(AdminTransactionContext);
    if (!context) {
        throw new Error('useAdminTransaction must be used within an AdminTransactionProvider');
    }
    return context;
};

export const AdminTransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CHANGE THIS LINE WHEN DEPLOYING
    // Development: 'http://localhost:8080'
    // Production:  'http://34.193.71.203'
    const API_BASE_URL = 'http://localhost:8080';
    // const API_BASE_URL = 'http://34.193.71.203';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const getAllTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch transactions');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTransaction = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setTransactions(prevTransactions => 
                    prevTransactions.filter(transaction => transaction.id !== id)
                );
                return { success: true, message: 'Transaction deleted successfully' };
            } else {
                let errorMessage = 'Failed to delete transaction';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const markTransactionAsFailed = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/failed`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setTransactions(prevTransactions => 
                    prevTransactions.map(transaction => 
                        transaction.id === id ? { ...transaction, status: 'FAILED' } : transaction
                    )
                );
                return { success: true, message: 'Transaction marked as failed' };
            } else {
                let errorMessage = 'Failed to mark transaction as failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS':
                return 'bg-green-100 text-green-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        transactions,
        loading,
        error,
        getAllTransactions,
        deleteTransaction,
        markTransactionAsFailed,
        formatCurrency,
        formatDate,
        getStatusColor,
        clearError,
    };

    return (
        <AdminTransactionContext.Provider value={value}>
            {children}
        </AdminTransactionContext.Provider>
    );
};