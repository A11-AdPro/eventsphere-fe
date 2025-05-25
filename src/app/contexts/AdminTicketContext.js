'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const AdminTicketContext = createContext();

export const useAdminTicket = () => {
    const context = useContext(AdminTicketContext);
    if (!context) {
        throw new Error('useAdminTicket must be used within an AdminTicketProvider');
    }
    return context;
};

export const AdminTicketProvider = ({ children }) => {
    const [tickets, setTickets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token not found');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const getAllTickets = async () => {
        const res = await fetch('http://localhost:3000/api/tickets');  // sesuaikan base URL mu
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Error ${res.status}: ${text}`);
        }
        return res.json();
    };

    const deleteTicket = useCallback(async (ticketId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setTickets(prevTickets => 
                    prevTickets.filter(ticket => ticket.id !== ticketId)
                );
                return { success: true, message: 'Ticket deleted successfully' };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete ticket');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const getAllTransactions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/transactions', {
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

    const getUserTransactions = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/transactions/user/${userId}`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch user transactions');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTransaction = useCallback(async (transactionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setTransactions(prevTransactions => 
                    prevTransactions.filter(transaction => transaction.id !== transactionId)
                );
                return { success: true, message: 'Transaction deleted successfully' };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete transaction');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const markTransactionAsFailed = useCallback(async (transactionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/transactions/${transactionId}/failed`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setTransactions(prevTransactions => 
                    prevTransactions.map(transaction => 
                        transaction.id === transactionId 
                            ? { ...transaction, status: 'FAILED' }
                            : transaction
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

    const getTransactionById = useCallback(async (transactionId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch transaction');
            }
        } catch (error) {
            setError(error.message);
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const getStatusColor = useCallback((status) => {
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
    }, []);

    const value = {
        tickets,
        transactions,
        loading,
        error,
        getAllTickets,
        deleteTicket,
        getAllTransactions,
        getUserTransactions,
        deleteTransaction,
        markTransactionAsFailed,
        getTransactionById,
        clearError,
        formatCurrency,
        formatDate,
        getStatusColor,
    };

    return (
        <AdminTicketContext.Provider value={value}>
            {children}
        </AdminTicketContext.Provider>
    );
};