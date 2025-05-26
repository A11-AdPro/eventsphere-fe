'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://34.193.71.203';

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
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Purchase ticket by ID
  const purchaseTicket = async (ticketId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Purchasing ticket:', ticketId);
      
      const data = await apiCall(`/api/transactions/purchase/ticket/${ticketId}`, {
        method: 'POST'
      });

      console.log('Purchase response:', data);

      // Refresh transactions after purchase
      await fetchCurrentUserTransactions();
      
      return data;
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get current user transactions
  const fetchCurrentUserTransactions = async () => {
    try {
      setError(null);
      const data = await apiCall('/api/transactions/my-transactions');
      
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
      setTransactions([]);
      throw error;
    }
  };

  // Get transaction by ID
  const getTransactionById = async (transactionId) => {
    try {
      setError(null);
      const data = await apiCall(`/api/transactions/${transactionId}`);
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get transactions filtered by type
  const getTransactionsByType = (type) => {
    return transactions.filter(transaction => transaction.type === type);
  };

  // Get transactions filtered by status
  const getTransactionsByStatus = (status) => {
    return transactions.filter(transaction => transaction.status === status);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
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

  // Get transaction type display name
  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case 'TOP_UP':
        return 'Top Up';
      case 'TICKET_PURCHASE':
        return 'Pembelian Tiket';
      default:
        return type;
    }
  };

  // Get transaction status display name
  const getTransactionStatusDisplay = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'Berhasil';
      case 'FAILED':
        return 'Gagal';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  };

  // Get status color class
  const getStatusColorClass = (status) => {
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

  // Get type color class
  const getTypeColorClass = (type) => {
    switch (type) {
      case 'TOP_UP':
        return 'bg-blue-100 text-blue-800';
      case 'TICKET_PURCHASE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUserTransactions().catch(console.error);
    }
  }, []);

  const value = {
    transactions,
    loading,
    error,
    purchaseTicket,
    fetchCurrentUserTransactions,
    getTransactionById,
    getTransactionsByType,
    getTransactionsByStatus,
    formatCurrency,
    formatDate,
    getTransactionTypeDisplay,
    getTransactionStatusDisplay,
    getStatusColorClass,
    getTypeColorClass,
    setError,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};