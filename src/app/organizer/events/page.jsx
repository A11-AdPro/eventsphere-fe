'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useRouter } from 'next/navigation';

export default function OrganizerEventsPage() {
    const { user, isOrganizer } = useAuth();
    const { 
        myEvents, 
        loading, 
        error, 
        getMyEvents, 
        cancelEvent, 
        deleteEvent,
        formatCurrency,
        formatDate,
        clearError 
    } = useEvent();
    const router = useRouter();

    const [filteredEvents, setFilteredEvents] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        if (!user || !isOrganizer()) {
            router.push('/login');
            return;
        }
        getMyEvents();
    }, [user, isOrganizer, router, getMyEvents]);

    useEffect(() => {
        let filtered = myEvents;

        if (filterStatus === 'ACTIVE') {
            filtered = filtered.filter(event => event.isActive && !event.isCancelled);
        } else if (filterStatus === 'CANCELLED') {
            filtered = filtered.filter(event => event.isCancelled);
        } else if (filterStatus === 'PAST') {
            filtered = filtered.filter(event => new Date(event.eventDate) < new Date());
        } else if (filterStatus === 'UPCOMING') {
            filtered = filtered.filter(event => 
                new Date(event.eventDate) > new Date() && !event.isCancelled
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(event => 
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredEvents(filtered);
    }, [myEvents, filterStatus, searchTerm]);

    const handleCancelEvent = async () => {
        if (!selectedEvent) return;
        
        const result = await cancelEvent(selectedEvent.id);
        if (result.success) {
            setShowCancelModal(false);
            setSelectedEvent(null);
            getMyEvents(); 
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        
        const result = await deleteEvent(selectedEvent.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedEvent(null);
            getMyEvents(); 
        }
    };

    const getEventStatusBadge = (event) => {
        if (event.isCancelled) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
        }
        
        const eventDate = new Date(event.eventDate);
        const now = new Date();
        
        if (eventDate < now) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Past</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Upcoming</span>;
        }
    };

    const canEditEvent = (event) => {
        if (event.isCancelled) return false;
        const eventDate = new Date(event.eventDate);
        const now = new Date();
        const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
        return hoursUntilEvent > 24; 
    };

    const canCancelEvent = (event) => {
        if (event.isCancelled) return false;
        const eventDate = new Date(event.eventDate);
        const now = new Date();
        return eventDate > now; 
    };

    const canDeleteEvent = (event) => {
        return event.isCancelled || new Date(event.eventDate) < new Date();
    };

    if (!user || !isOrganizer()) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                ORGANIZER
                            </span>
                        </div>
                        <button
                            onClick={() => router.push('/organizer/events/create')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            Create New Event
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                                <p className="text-2xl font-semibold text-gray-900">{myEvents.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Active Events</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {myEvents.filter(e => e.isActive && !e.isCancelled).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Upcoming</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {myEvents.filter(e => new Date(e.eventDate) > new Date() && !e.isCancelled).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {myEvents.filter(e => e.isCancelled).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Status Filter */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm font-medium text-gray-700 self-center mr-2">Filter:</span>
                            {['ALL', 'ACTIVE', 'UPCOMING', 'PAST', 'CANCELLED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        filterStatus === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg">No events found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {myEvents.length === 0 ? 'Create your first event to get started!' : 'Try adjusting your filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {event.title}
                                        </h3>
                                        {getEventStatusBadge(event)}
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {event.description || 'No description available'}
                                    </p>
                                    
                                    <div className="space-y-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(event.eventDate)}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {event.location}
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            {formatCurrency(event.price)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 bg-gray-50 border-t">
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-2">
                                            {canEditEvent(event) && (
                                                <button
                                                    onClick={() => router.push(`/organizer/events/${event.id}/edit`)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push(`/organizer/events/${event.id}`)}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                            >
                                                View
                                            </button>
                                        </div>
                                        <div className="flex space-x-2">
                                            {canCancelEvent(event) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowCancelModal(true);
                                                    }}
                                                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {canDeleteEvent(event) && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Event Modal */}
            {showCancelModal && selectedEvent && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900">Cancel Event</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to cancel "{selectedEvent.title}"?
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600"
                                    >
                                        Keep Event
                                    </button>
                                    <button
                                        onClick={handleCancelEvent}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-yellow-600 text-white text-base font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Cancelling...' : 'Cancel Event'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Event Modal */}
            {showDeleteModal && selectedEvent && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900">Delete Event</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete "{selectedEvent.title}"?
                                    This will permanently remove the event from the system.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteEvent}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Deleting...' : 'Delete Event'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}