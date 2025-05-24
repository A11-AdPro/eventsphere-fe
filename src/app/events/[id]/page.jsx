'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEvents } from '../../contexts/EventContext';
import { useTickets } from '../../contexts/TicketContext';
import { useAuth } from '../../contexts/AuthContext'; 
import { Calendar, MapPin, Users, ArrowLeft, CreditCard, Plus, Edit, Trash2 } from 'lucide-react';

const EventDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id);
  
  const { 
    selectedEvent, 
    fetchEventById, 
    formatCurrency, 
    formatDate, 
    loading: eventLoading,
    error: eventError 
  } = useEvents();
  
  const {
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

  useEffect(() => {
    if (eventId) {
      fetchEventById(eventId);
      fetchTicketsByEventId(eventId);
    }
  }, [eventId]);

  const handleBackToEvents = () => {
    router.push('/events');
  };

  const handlePurchaseTicket = (ticketId) => {
    router.push(`/payment?ticketId=${ticketId}`);
  };

  const handleCreateTicket = () => {
    setShowCreateTicket(true);
  };

  const handleEditEvent = () => {
    router.push(`/events/${eventId}/edit`);
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
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* Event Image Placeholder */}
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
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onPurchase={handlePurchaseTicket}
                  formatCurrency={formatTicketCurrency}
                  getTicketCategoryColor={getTicketCategoryColor}
                  isTicketAvailable={isTicketAvailable}
                  user={user}
                  userBalance={userBalance}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <CreateTicketModal
          eventId={eventId}
          onClose={() => setShowCreateTicket(false)}
          onSuccess={() => {
            setShowCreateTicket(false);
            fetchTicketsByEventId(eventId);
          }}
        />
      )}
    </div>
  );
};

// Ticket Card Component - FIXED: Use user object instead of userRole string
const TicketCard = ({ 
  ticket, 
  onPurchase, 
  formatCurrency, 
  getTicketCategoryColor, 
  isTicketAvailable, 
  user,
  userBalance 
}) => {
  const canPurchase = user && user.role === 'ATTENDEE' && isTicketAvailable(ticket);
  const hasEnoughBalance = userBalance >= ticket.price;

  return (
    <div className="border rounded-lg p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center mb-3">
          <h3 className="text-xl font-semibold text-gray-900 mr-3">{ticket.name}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTicketCategoryColor(ticket.category)}`}>
            {ticket.category}
          </span>
        </div>
        
        <div className="text-3xl font-bold text-green-600 mb-2">
          {formatCurrency(ticket.price)}
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
        {canPurchase ? (
          <div className="text-right">
            {!hasEnoughBalance && (
              <p className="text-red-600 text-sm mb-2">Insufficient balance</p>
            )}
            <button
              onClick={() => onPurchase(ticket.id)}
              disabled={!hasEnoughBalance}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                hasEnoughBalance
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
              onClick={() => window.location.href = '/login'}
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
  );
};

// Create Ticket Modal Component
const CreateTicketModal = ({ eventId, onClose, onSuccess }) => {
  const { createTicket, loading } = useTickets();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quota: '',
    category: 'REGULAR'
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    try {
      await createTicket({
        ...formData,
        price: parseFloat(formData.price),
        quota: parseInt(formData.quota),
        eventId: eventId
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., VIP Access, General Admission"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (IDR)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quota
            </label>
            <input
              type="number"
              name="quota"
              value={formData.quota}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="REGULAR">Regular</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;