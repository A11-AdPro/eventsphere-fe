'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useTickets } from '../contexts/TicketContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Users, DollarSign, TrendingUp, Eye, Edit, Trash2, AlertCircle, CheckCircle, Clock, Bell } from 'lucide-react';
import Header from '../components/Header';

export default function OrganizerDashboard() {
    const { user, logout, isOrganizer, loading: authLoading } = useAuth();
    const router = useRouter();
    const { events, loading: eventsLoading, fetchOrganizerEvents, deleteEvent, formatCurrency, formatDate } = useEvents();
    const { tickets, fetchAllTickets } = useTickets();
    const { unreadCount } = useNotifications();

    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeEvents: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
        pendingEvents: 0,
        cancelledEvents: 0
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                console.log('No user, redirecting to login');
                router.push('/login');
                return;
            }

            const organizerCheck = typeof isOrganizer === 'function' ? isOrganizer() : isOrganizer;

            if (!organizerCheck) {
                console.log('User is not organizer, redirecting to login');
                router.push('/login');
                return;
            }

            // Load organizer data
            loadOrganizerData();
        }
    }, [user, isOrganizer, router, authLoading, mounted]);

    const loadOrganizerData = async () => {
        try {
            // Fetch organizer events
            const organizerEvents = await fetchOrganizerEvents();

            // Fetch all tickets to calculate stats
            await fetchAllTickets();

            // Calculate stats
            calculateStats(organizerEvents);
        } catch (error) {
            console.error('Error loading organizer data:', error);
        }
    };

    const calculateStats = (organizerEvents) => {
        const activeEvents = organizerEvents.filter(event =>
            event.isActive && !event.isCancelled && new Date(event.eventDate) > new Date()
        );

        const cancelledEvents = organizerEvents.filter(event => event.isCancelled);
        const pendingEvents = organizerEvents.filter(event =>
            event.isActive && !event.isCancelled && new Date(event.eventDate) < new Date()
        );

        // Calculate ticket sales and revenue (simplified - you might need to adjust based on your backend)
        const eventIds = organizerEvents.map(event => event.id);
        const organizerTickets = tickets.filter(ticket => eventIds.includes(ticket.eventId));
        const soldTickets = organizerTickets.filter(ticket => ticket.soldOut || ticket.quota === 0);
        const totalRevenue = organizerTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);

        setStats({
            totalEvents: organizerEvents.length,
            activeEvents: activeEvents.length,
            totalTicketsSold: soldTickets.length,
            totalRevenue: totalRevenue,
            pendingEvents: pendingEvents.length,
            cancelledEvents: cancelledEvents.length
        });
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleCreateEvent = () => {
        router.push('/organizer/events/create');
    };

    const handleViewEvent = (eventId) => {
        router.push(`/organizer/events/${eventId}`);
    };

    const handleEditEvent = (eventId) => {
        router.push(`/organizer/events/${eventId}/edit`);
    };

    const handleDeleteEvent = async (eventId, eventTitle) => {
        if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
            try {
                await deleteEvent(eventId);
                await loadOrganizerData(); // Refresh data
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event. Please try again.');
            }
        }
    };

    const getEventStatus = (event) => {
        if (event.isCancelled) return { status: 'Cancelled', color: 'text-red-600 bg-red-100' };
        if (!event.isActive) return { status: 'Inactive', color: 'text-gray-600 bg-gray-100' };

        const eventDate = new Date(event.eventDate);
        const now = new Date();

        if (eventDate < now) return { status: 'Past', color: 'text-orange-600 bg-orange-100' };
        return { status: 'Active', color: 'text-green-600 bg-green-100' };
    };

    if (!mounted || authLoading || eventsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const organizerCheck = typeof isOrganizer === 'function' ? isOrganizer() : isOrganizer;
    if (!user || !organizerCheck) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title="Organizer Dashboard"
                subtitle="Manage your events and track performance"
                actions={[
                    {
                        label: 'Create Event',
                        onClick: handleCreateEvent,
                        className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center',
                        icon: <Plus className="w-4 h-4 mr-2" />
                    }
                ]}
            />

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Calendar className="w-8 h-8 bg-blue-500 text-white p-2 rounded-md" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                                        <dd className="text-2xl font-bold text-gray-900">{stats.totalEvents}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="w-8 h-8 bg-green-500 text-white p-2 rounded-md" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                                        <dd className="text-2xl font-bold text-gray-900">{stats.activeEvents}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="w-8 h-8 bg-purple-500 text-white p-2 rounded-md" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Tickets Sold</dt>
                                        <dd className="text-2xl font-bold text-gray-900">{stats.totalTicketsSold}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <DollarSign className="w-8 h-8 bg-yellow-500 text-white p-2 rounded-md" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                        <dd className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={handleCreateEvent}
                            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Event
                        </button>

                        <button
                            onClick={() => router.push('/organizer/events')}
                            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Manage Events
                        </button>

                        <button
                            onClick={() => router.push('/organizer/reports')}
                            className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition duration-200"
                        >
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Manage Reports
                        </button>

                        <button
                            onClick={() => router.push('/organizer/analytics')}
                            className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition duration-200"
                        >
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Event Analytics
                        </button>
                    </div>
                </div>

                {/* Recent Events */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Your Events</h3>
                            <button
                                onClick={() => router.push('/organizer/events')}
                                className="text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                                View all →
                            </button>
                        </div>
                    </div>

                    {events.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by creating your first event.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={handleCreateEvent}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                                    Create Event
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                {events.slice(0, 5).map((event) => {
                                    const eventStatus = getEventStatus(event);
                                    return (
                                        <div key={event.id} className="px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {event.title}
                                                        </h4>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${eventStatus.color}`}>
                                                            {eventStatus.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span>📅 {formatDate(event.eventDate)}</span>
                                                        <span>📍 {event.location}</span>
                                                        <span>💰 {formatCurrency(event.ticketPrice || 0)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewEvent(event.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditEvent(event.id)}
                                                        className="text-green-600 hover:text-green-900 p-1"
                                                        title="Edit Event"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id, event.title)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete Event"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Stats Row */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-orange-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Past Events</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.pendingEvents}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Cancelled Events</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.cancelledEvents}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Bell className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Notifications</dt>
                                        <dd className="text-lg font-medium text-gray-900">{unreadCount}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}