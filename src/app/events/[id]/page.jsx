'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEvents } from '../../contexts/EventContext';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext'; 
import { Calendar, MapPin, Users, ArrowLeft, CreditCard, Plus, Edit, Trash2, XCircle } from 'lucide-react';

const EventDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id);
  
  const { 
    selectedEvent, 
    fetchEventById, 
    deleteEvent,
    cancelEvent,
    formatCurrency, 
    formatDate, 
    loading: eventLoading,
    error: eventError 
  } = useEvents();
  
  const {
    loading,
    eventTickets,
    fetchTicketsByEventId,
    userBalance,
    formatCurrency: formatTicketCurrency,
    getTicketCategoryColor,
    isTicketAvailable,
    loading: ticketLoading,
    error: ticketError
  } = useTickets();

  const { user } = useAuth();
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventById(eventId);
      fetchTicketsByEventId(eventId);
    }
  }, [eventId]);

  const handleBackToEvents = () => {
    router.push('/events');
  };

  const handleEditEvent = () => {
    router.push(`/events/edit/${eventId}`);
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      router.push('/events');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      await cancelEvent(eventId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchEventById(eventId);
      await fetchTicketsByEventId(eventId);
    } catch (error) {
      console.error('Error refreshing event:', error);
    }
  };

  const tickets = eventTickets[eventId] || [];
  const isEventOrganizer = user && user.role === 'ORGANIZER' && selectedEvent && selectedEvent.organizerId === user.id;

  if (eventLoading || ticketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (eventError || !selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={handleBackToEvents}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToEvents}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Events
            </button>
            
            {isEventOrganizer && (
              <div className="flex gap-2">
                <button
                  onClick={handleEditEvent}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </button>
                {selectedEvent.active && !selectedEvent.cancelled && (
                  <button
                    onClick={handleCancelEvent}
                    disabled={isCancelling}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {isCancelling ? 'Cancelling...' : 'Cancel Event'}
                  </button>
                )}
                
                <button
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </button>


              </div>
            )}
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
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <h1 className="text-white text-4xl font-bold text-center px-8">
              {selectedEvent.title}
            </h1>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-gray-600">{formatDate(selectedEvent.eventDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{selectedEvent.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium">Organized by</p>
                      <p className="text-gray-600">{selectedEvent.organizerName}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Event</h3>
                {selectedEvent.description ? (
                  <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              {selectedEvent.cancelled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Cancelled
                </span>
              ) : !selectedEvent.active ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              ) : new Date(selectedEvent.eventDate) < new Date() ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </div>
            
            {selectedEvent.cancelled && selectedEvent.cancellationTime && (
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled On</p>
                <p className="text-gray-900">{formatDate(selectedEvent.cancellationTime)}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="text-gray-900">{formatDate(selectedEvent.createdAt)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-gray-900">{formatDate(selectedEvent.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Balance Display for Attendees */}
        {user && user.role === 'ATTENDEE' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Balance</h3>
                <p className="text-2xl font-bold text-green-600">{formatTicketCurrency(userBalance)}</p>
              </div>
              <button
                onClick={() => router.push('/topup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Top Up
              </button>
            </div>
          </div>
        )}

        {/* Tickets Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Tickets</h2>
            {tickets.length > 0 && (
              <p className="text-gray-600">{tickets.length} ticket type(s) available</p>
            )}
          </div>

          {ticketError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>Error loading tickets: {ticketError}</p>
            </div>
          )}

          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <CreditCard className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Available</h3>
              <p className="text-gray-500">
                {user?.role === 'ORGANIZER' 
                  ? 'Create tickets for this event to start selling'
                  : 'Tickets for this event are not available yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className="border rounded-lg p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mr-3">{ticket.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTicketCategoryColor(ticket.category)}`}>
                        {ticket.category}
                      </span>
                    </div>
                    
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatTicketCurrency(ticket.price)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {ticket.soldOut ? (
                        <span className="text-red-600 font-medium">Sold Out</span>
                      ) : (
                        <span>{ticket.quota} tickets remaining</span>
                      )}
                      <span>•</span>
                      <span>{ticket.sold || 0} sold</span>
                    </div>
                  </div>

                  <div className="ml-6">
                    {user?.role === 'ATTENDEE' && isTicketAvailable(ticket) ? (
                      <div className="text-right">
                        {userBalance < ticket.price && (
                          <p className="text-red-600 text-sm mb-2">Insufficient balance</p>
                        )}
                        <button
                          onClick={() => router.push(`/payment?ticketId=${ticket.id}`)}
                          disabled={userBalance < ticket.price}
                          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            userBalance >= ticket.price
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Buy Ticket
                        </button>
                      </div>
                    ) : ticket.soldOut ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    ) : !user ? (
                      <div className="text-gray-500 text-sm text-right">
                        <button
                          onClick={() => router.push('/login')}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Login to purchase
                        </button>
                      </div>
                    ) : user.role !== 'ATTENDEE' ? (
                      <div className="text-gray-500 text-sm text-right">
                        {user.role === 'ORGANIZER' ? 'Your ticket' : 'Attendee access required'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;