'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const TopUpContext = createContext();

export const useTopUp = () => {
  const context = useContext(TopUpContext);
  if (!context) {
    throw new Error('useTopUp must be used within a TopUpProvider');
  }
  return context;
};

export const TopUpProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [topUpHistory, setTopUpHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Get current user balance
  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await apiCall('/api/auth/me');

      // Extract the balance from the response
      const userBalance = userData.balance || 0;
      setBalance(userBalance); // Set the balance state

      return userBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError(error.message);
      setBalance(0); // Set balance to 0 if there is an error
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process top-up
  const processTopUp = async (amount, topUpType = 'FIXED') => {
    try {
      setLoading(true);
      setError(null);
      
      const requestData = {
        amount: parseInt(amount),
        topUpType: topUpType
      };

      console.log('Sending top-up request:', requestData);
      
      const data = await apiCall('/api/topup', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      console.log('Top-up response:', data);

      // Update balance after successful top-up
      if (data && typeof data.newBalance !== 'undefined') {
        setBalance(data.newBalance);
      }
      
      // Refresh history
      await fetchTopUpHistory();
      
      return data;
    } catch (error) {
      console.error('Error processing top-up:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get top-up history
  const fetchTopUpHistory = async () => {
    try {
      setError(null);
      const data = await apiCall('/api/topup/history');
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTopUpHistory(data);
      } else {
        setTopUpHistory([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching top-up history:', error);
      setError(error.message);
      setTopUpHistory([]);
      throw error;
    }
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

  // Initial data fetch
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchBalance().catch(console.error);
      fetchTopUpHistory().catch(console.error);
    }
  }, []);

  const value = {
    balance,
    topUpHistory,
    loading,
    error,
    processTopUp,
    fetchBalance,
    fetchTopUpHistory,
    formatCurrency,
    formatDate,
    setError,
  };

  return (
    <TopUpContext.Provider value={value}>
      {children}
    </TopUpContext.Provider>
  );
};