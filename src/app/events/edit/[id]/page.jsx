'use client';

import React, { useState, useEffect} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEvents } from '../../../contexts/EventContext';
import { Calendar, MapPin, XCircle, ArrowLeft } from 'lucide-react';

const EditEventPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id);
  const { 
    selectedEvent, 
    fetchEventById, 
    updateEvent, 
    loading, 
    error,
    formatCurrency,
    formatDate,
    setSelectedEvent
  } = useEvents();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    price: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch event when component mounts with timeout
  useEffect(() => {
    const loadEvent = async () => {
      if (eventId && !isNaN(eventId)) {
        console.log('Loading event with ID:', eventId);
        setIsLoading(true);
        setFetchError(null);
        
        // Set timeout untuk mencegah loading forever
        const timeoutId = setTimeout(() => {
          console.error('Fetch timeout after 10 seconds');
          setFetchError('Request timeout - please try again');
          setIsLoading(false);
          setHasInitialized(true);
        }, 10000);
        
        try {
          const result = await fetchEventById(eventId);
          console.log('Fetch result:', result);
          clearTimeout(timeoutId);
        } catch (err) {
          console.error('Error fetching event:', err);
          setFetchError(err.message || 'Failed to load event');
          clearTimeout(timeoutId);
        } finally {
          setIsLoading(false);
          setHasInitialized(true);
        }
      } else {
        console.error('Invalid event ID:', eventId);
        setFetchError('Invalid event ID');
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    loadEvent();
  }, [eventId]); // Removed fetchEventById from dependencies to prevent infinite loop

  // Update form data when selectedEvent is available
  useEffect(() => {
    if (selectedEvent && hasInitialized) {
      console.log('Populating form with event data:', selectedEvent);
      setFormData({
        title: selectedEvent.title || '',
        description: selectedEvent.description || '',
        eventDate: selectedEvent.eventDate ? selectedEvent.eventDate.slice(0, 16) : '',
        location: selectedEvent.location || '',
        price: selectedEvent.price ? selectedEvent.price.toString() : ''
      });
    }
  }, [selectedEvent, hasInitialized]);

  // Cleanup - only reset on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, clearing selectedEvent');
      if (setSelectedEvent) {
        setSelectedEvent(null);
      }
    };
  }, [setSelectedEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.eventDate) {
      errors.eventDate = 'Event date is required';
    } else if (new Date(formData.eventDate) <= now) {
      errors.eventDate = 'Event date must be in the future';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price)) {
      errors.price = 'Price must be a number';
    } else if (parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be positive';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const eventData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      console.log('Updating event with data:', eventData);
      await updateEvent(eventId, eventData);
      router.push(`/events/${eventId}`);
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleBack = () => {
    router.push(`/events/${eventId}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
          <p className="mt-2 text-sm text-gray-500">Event ID: {eventId}</p>
          <button
            onClick={handleRetry}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Taking too long? Click to retry
          </button>
        </div>
      </div>
    );
  }

  // Show fetch error state
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Error loading event</p>
          <p className="mt-2 text-sm text-red-500">{fetchError}</p>
          <p className="mt-1 text-sm text-gray-500">Event ID: {eventId}</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/events')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show context error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Context Error</p>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <p className="mt-1 text-sm text-gray-500">Event ID: {eventId}</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state only after everything is loaded
  if (hasInitialized && !selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Event not found</p>
          <p className="mt-2 text-sm text-gray-500">Event ID: {eventId}</p>
          <p className="mt-1 text-xs text-gray-400">
            {isNaN(eventId) ? 'Invalid ID format' : 'Event may have been deleted or ID is incorrect'}
          </p>
          <button
            onClick={() => router.push('/events')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Event
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${validationErrors.eventDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {validationErrors.eventDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.eventDate}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${validationErrors.location ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {validationErrors.location && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (IDR) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;