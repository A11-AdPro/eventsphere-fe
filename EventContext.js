'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/api/events/my-events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch your events');
      }
      
      const data = await response.json();
      setEvents(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchEventById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      
      const data = await response.json();
      setSelectedEvent(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }
      
      const newEvent = await response.json();
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id, eventData) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }
      
      const updatedEvent = await response.json();
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      setSelectedEvent(updatedEvent);
      return updatedEvent;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      setEvents(prev => prev.filter(event => event.id !== id));
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
      }
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelEvent = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`/api/events/cancel/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel event');
      }
      
      await fetchEvents();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
    return event.active && !event.cancelled && new Date(event.eventDate) > new Date();
  };

  useEffect(() => {
    if (user) {
      fetchEvents().catch(console.error);
    }
  }, [user]);

  return (
    <EventContext.Provider value={{
      events,
      selectedEvent,
      loading,
      error,
      fetchEvents,
      fetchOrganizerEvents,
      fetchEventById,
      createEvent,
      updateEvent,
      deleteEvent,
      cancelEvent,
      setSelectedEvent,
      setError,
      formatCurrency,
      formatDate,
      isEventActive
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};