'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEvents } from '../contexts/EventContext';
import { Calendar, MapPin, Users, Plus, ArrowLeft } from 'lucide-react';

const EventsPage = () => {
  const router = useRouter();
  const { 
    events, 
    loading, 
    error, 
    fetchEvents, 
    formatCurrency, 
    formatDate, 
    isEventActive 
  } = useEvents();
  
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    setUserRole(role);
  }, []);

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  const handleCreateEvent = () => {
    router.push('/events/create');
  };
  
  const handleRefresh = async () => {
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  }; 

  const handleBackToDashboard = () => {
    router.push('/');
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Events</h1>
                <p className="text-gray-600 mt-1">Discover amazing events happening around you</p>
              </div>
              {userRole === 'ORGANIZER' && (
                <button
                  onClick={handleCreateEvent}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event.id)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {loading && events.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const EventCard = ({ event, onClick, formatCurrency, formatDate }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Event Image Placeholder */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <h3 className="text-white text-xl font-bold text-center px-4">
          {event.title}
        </h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{formatDate(event.eventDate)}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">by {event.organizerName}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-green-600">
            Starting from {formatCurrency(event.price)}
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;