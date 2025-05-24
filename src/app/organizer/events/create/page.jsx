'use client';

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvent } from '../../../contexts/EventContext';
import { useRouter } from 'next/navigation';

export default function CreateEventPage() {
    const { user, isOrganizer } = useAuth();
    const { createEvent, loading, error, clearError } = useEvent();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        price: ''
    });
    const [success, setSuccess] = useState('');

    if (!user || !isOrganizer()) {
        router.push('/login');
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setSuccess('');

        if (!formData.title.trim()) {
            return;
        }

        if (!formData.eventDate) {
            return;
        }

        if (new Date(formData.eventDate) <= new Date()) {
            alert('Event date must be in the future');
            return;
        }

        if (!formData.location.trim()) {
            return;
        }

        if (!formData.price || parseFloat(formData.price) < 0) {
            alert('Price must be a valid positive number');
            return;
        }

        const eventData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            eventDate: formData.eventDate,
            location: formData.location.trim(),
            price: parseFloat(formData.price)
        };

        const result = await createEvent(eventData);
        
        if (result.success) {
            setSuccess('Event created successfully!');
            setFormData({
                title: '',
                description: '',
                eventDate: '',
                location: '',
                price: ''
            });
            
            setTimeout(() => {
                router.push('/organizer/events');
            }, 2000);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 16);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/organizer/events')}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Back to My Events
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
                    <p className="text-gray-600 mt-1">Fill in the details for your new event</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Event Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event title"
                                required
                            />
                        </div>

                        {/* Event Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe your event (optional)"
                            />
                        </div>

                        {/* Event Date */}
                        <div>
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Event Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="eventDate"
                                name="eventDate"
                                type="datetime-local"
                                value={formData.eventDate}
                                onChange={handleChange}
                                min={getMinDate()}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Event must be scheduled for at least tomorrow
                            </p>
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event location"
                                required
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                Ticket Price (IDR) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                                required
                            />
                            {formData.price && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Preview: {formatCurrency(formData.price)}
                                </p>
                            )}
                        </div>

                        {/* Preview Card */}
                        {formData.title && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Event Preview</h3>
                                <div className="bg-white p-4 rounded-lg border">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        {formData.title}
                                    </h4>
                                    {formData.description && (
                                        <p className="text-gray-600 text-sm mb-3">
                                            {formData.description}
                                        </p>
                                    )}
                                    <div className="space-y-2 text-sm text-gray-500">
                                        {formData.eventDate && (
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(formData.eventDate).toLocaleString('id-ID', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        )}
                                        {formData.location && (
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {formData.location}
                                            </div>
                                        )}
                                        {formData.price && (
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                {formatCurrency(formData.price)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-xs text-gray-400">
                                            Organizer: {user.fullName || user.email}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/organizer/events')}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                            >
                                {loading ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </form>

                    {/* Tips */}
                    <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Creating Great Events</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Use a clear and descriptive title that explains what your event is about</li>
                            <li>• Include detailed information in the description to help attendees understand what to expect</li>
                            <li>• Set your event date at least 24 hours in advance to allow for proper planning</li>
                            <li>• Be specific about the location - include address or venue details</li>
                            <li>• Price your tickets competitively based on the value you're providing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}