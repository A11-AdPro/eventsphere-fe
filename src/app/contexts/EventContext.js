'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

const API_BASE_URL = 'http://localhost:8080/api';

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch single event by ID
  const fetchEventById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.status}`);
      }

      const data = await response.json();
      setSelectedEvent(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create new event (for organizers)
  const createEvent = async (eventData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create event: ${response.status}`);
      }

      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err.message);
      console.error('Error creating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update event (for organizers)
  const updateEvent = async (id, eventData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update event: ${response.status}`);
      }

      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(updatedEvent);
      }
      
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      console.error('Error updating event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete event (for organizers)
  const deleteEvent = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete event: ${response.status}`);
      }

      setEvents(prev => prev.filter(event => event.id !== id));
      
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel event (for organizers)
  const cancelEvent = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/events/cancel/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to cancel event: ${response.status}`);
      }

      // Refresh events list
      await fetchEvents();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error canceling event:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

 const fetchOrganizerEvents = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch(`${API_BASE_URL}/events/my-events`, { // Ensure API_BASE_URL is correct
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch organizer events: ${response.status}`);
    }

    const data = await response.json();
    setEvents(data);  // Use the data directly from the API
    return data;      // Return the data
  } catch (err) {
    setError(err.message);
    console.error('Error fetching organizer events:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventActive = (event) => {
    return event.isActive && !event.isCancelled && new Date(event.eventDate) > new Date();
  };

  // Load events on mount - FIXED: Only load if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchEvents().catch(console.error);
    }
  }, []);

  const value = {
    // State
    events,
    selectedEvent,
    loading,
    error,
    
    // Actions
    fetchEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    cancelEvent,
    fetchOrganizerEvents,
    setSelectedEvent,
    setError,
    
    // Utilities
    formatCurrency,
    formatDate,
    isEventActive
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};