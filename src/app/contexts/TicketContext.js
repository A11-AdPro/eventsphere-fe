'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const TicketContext = createContext();

const API_BASE_URL = 'http://localhost:8080/api';

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [eventTickets, setEventTickets] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch all available tickets
  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched tickets:', data);
      setTickets(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tickets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets for a specific event
  const fetchTicketsByEventId = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const allTickets = await response.json();
      const eventSpecificTickets = allTickets.filter(ticket => ticket.eventId === eventId);
      
      setEventTickets(prev => ({
        ...prev,
        [eventId]: eventSpecificTickets
      }));
      
      return eventSpecificTickets;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching event tickets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch single ticket by ID
  const fetchTicketById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching ticket by ID:', id);
      
      // First try to find in existing tickets
      const existingTicket = tickets.find(ticket => ticket.id === id);
      if (existingTicket) {
        console.log('Found ticket in cache:', existingTicket);
        setSelectedTicket(existingTicket);
        return existingTicket;
      }

      // If not found in cache, fetch all tickets and find the one we need
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const allTickets = await response.json();
      console.log('All tickets from API:', allTickets);
      setTickets(allTickets);
      
      const targetTicket = allTickets.find(ticket => ticket.id === id);
      if (!targetTicket) {
        throw new Error(`Ticket with ID ${id} not found`);
      }

      console.log('Found target ticket:', targetTicket);
      setSelectedTicket(targetTicket);
      return targetTicket;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new ticket (for organizers)
  const createTicket = async (ticketData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create ticket: ${response.status}`);
      }

      const newTicket = await response.json();
      
      // Update tickets state
      setTickets(prev => [...prev, newTicket]);
      
      // Update event-specific tickets if we have them
      if (eventTickets[ticketData.eventId]) {
        setEventTickets(prev => ({
          ...prev,
          [ticketData.eventId]: [...prev[ticketData.eventId], newTicket]
        }));
      }
      
      return newTicket;
    } catch (err) {
      setError(err.message);
      console.error('Error creating ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update ticket (for organizers)
  const updateTicket = async (id, ticketData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update ticket: ${response.status}`);
      }

      const updatedTicket = await response.json();
      
      // Update tickets state
      setTickets(prev => prev.map(ticket => 
        ticket.id === id ? updatedTicket : ticket
      ));
      
      // Update event-specific tickets
      if (updatedTicket.eventId && eventTickets[updatedTicket.eventId]) {
        setEventTickets(prev => ({
          ...prev,
          [updatedTicket.eventId]: prev[updatedTicket.eventId].map(ticket =>
            ticket.id === id ? updatedTicket : ticket
          )
        }));
      }
      
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(updatedTicket);
      }
      
      return updatedTicket;
    } catch (err) {
      setError(err.message);
      console.error('Error updating ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete ticket (for organizers/admin)
  const deleteTicket = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete ticket: ${response.status}`);
      }

      // Remove from tickets state
      setTickets(prev => prev.filter(ticket => ticket.id !== id));
      
      // Remove from event-specific tickets
      setEventTickets(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(eventId => {
          updated[eventId] = updated[eventId].filter(ticket => ticket.id !== id);
        });
        return updated;
      });
      
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(null);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Purchase ticket (payment) - FIXED
  const purchaseTicket = async (ticketId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Purchasing ticket with ID:', ticketId);
     
      const response = await fetch(`${API_BASE_URL}/transactions/purchase/ticket/${ticketId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        let errorMessage = `Failed to purchase ticket: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the default message
        }
        
        throw new Error(errorMessage);
      }

      const purchaseResult = await response.json();
      console.log('Purchase result:', purchaseResult);

      // Update user balance if provided in response
      if (purchaseResult.newBalance !== undefined) {
        setUserBalance(purchaseResult.newBalance);
      }
      
      // Refresh tickets to update sold status
      await fetchAllTickets();
      // If we have the ticket in our selected ticket, refresh it
      if (selectedTicket && selectedTicket.id === ticketId) {
        try {
          await fetchTicketById(ticketId);
        } catch (err) {
          console.warn('Failed to refresh selected ticket after purchase:', err);
        }
      }
      return purchaseResult;
    } catch (err) {
      setError(err.message);
      console.error('Error purchasing ticket:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user balance
  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const userData = await response.json();
      const balance = userData.balance || 0;
      console.log('User balance:', balance);
      setUserBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError(error.message);
      setUserBalance(0);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Top up balance
  const topUpBalance = async (amount, topUpType = 'CUSTOM') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/topup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, topUpType })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to top up: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.newBalance !== undefined) {
        setUserBalance(result.newBalance);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Error topping up balance:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get transaction history
  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/my-transactions`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  };

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTicketCategoryColor = (category) => {
    switch (category) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REGULAR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isTicketAvailable = (ticket) => {
    return !ticket.soldOut && ticket.quota > 0;
  };

  // Format date utility
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

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Load initial data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchAllTickets().catch(console.error);
      fetchUserBalance().catch(console.error);
    }
  }, []);

  const value = {
    // State
    tickets,
    eventTickets,
    selectedTicket,
    userBalance,
    loading,
    error,
    
    // Actions
    fetchAllTickets,
    fetchTicketsByEventId,
    fetchTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    purchaseTicket,
    fetchUserBalance,
    topUpBalance,
    fetchTransactionHistory,
    setSelectedTicket,
    setError,
    clearError,
    // Utilities
    formatCurrency,
    formatDate,
    getTicketCategoryColor,
    isTicketAvailable
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};