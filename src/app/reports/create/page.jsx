'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

export default function CreateReportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { createReport, loading, error, setError } = useReports();

    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        eventId: null,
        eventTitle: ''
    });
    const [formError, setFormError] = useState('');
    const [step, setStep] = useState(1);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Effect untuk memeriksa apakah datang dari halaman event
    useEffect(() => {
        const eventId = searchParams.get('eventId');
        const eventTitle = searchParams.get('eventTitle');

        if (eventId && eventTitle) {
            setFormData(prev => ({
                ...prev,
                eventId: parseInt(eventId),
                eventTitle: decodeURIComponent(eventTitle)
            }));
        }
    }, [searchParams]);

    // Effect untuk mengambil daftar event yang dihadiri oleh user
    useEffect(() => {
        if (mounted && user) {
            fetchUserEvents();
        }
    }, [mounted, user]);

    // Mengambil event yang dihadiri oleh user
    const fetchUserEvents = async () => {
        try {
            setLoadingEvents(true);
            const response = await fetch('http://localhost:8080/api/events', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const eventsData = await response.json();
                setEvents(eventsData);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memastikan user sudah terautentikasi dan memiliki akses
    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            if (user.role !== 'ATTENDEE') {
                router.push('/login');
            }
        }
    }, [user, router, authLoading, mounted]);

    // Daftar kategori laporan
    const categories = [
        { value: 'PAYMENT', label: 'Payment Issue', description: 'Problems with payments, refunds, or billing' },
        { value: 'TICKET', label: 'Ticket Issue', description: 'Issues with ticket purchase, access, or delivery' },
        { value: 'EVENT', label: 'Event Issue', description: 'Problems related to event details, venue, or scheduling' },
        { value: 'OTHER', label: 'Other Issue', description: 'Any other concerns or questions' }
    ];

    // Fungsi untuk menangani perubahan input form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFormError('');
        setError(null);
    };

    // Fungsi untuk menangani perubahan event yang dipilih
    const handleEventChange = (e) => {
        const selectedEventId = e.target.value;
        if (selectedEventId === '') {
            setFormData(prev => ({
                ...prev,
                eventId: null,
                eventTitle: ''
            }));
        } else {
            const selectedEvent = events.find(event => event.id === parseInt(selectedEventId));
            setFormData(prev => ({
                ...prev,
                eventId: parseInt(selectedEventId),
                eventTitle: selectedEvent ? selectedEvent.title : ''
            }));
        }
        setFormError('');
        setError(null);
    };

    // Validasi untuk step 1 (pemilihan kategori)
    const validateStep1 = () => {
        if (!formData.category) {
            setFormError('Please select a category for your report');
            return false;
        }
        return true;
    };

    // Melanjutkan ke step berikutnya
    const goToNextStep = () => {
        if (validateStep1()) {
            setFormError('');
            setStep(2);
        }
    };

    // Kembali ke step sebelumnya
    const goToPreviousStep = () => {
        setStep(1);
        setFormError('');
    };

    // Fungsi untuk mengirim laporan
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setError(null);

        if (!formData.description.trim()) {
            setFormError('Please provide a description of your issue');
            return;
        }

        if (formData.description.trim().length < 10) {
            setFormError('Description must be at least 10 characters long');
            return;
        }

        try {
            const reportData = {
                category: formData.category,
                description: formData.description.trim()
            };

            if (formData.eventId) {
                reportData.eventId = formData.eventId;
                reportData.eventTitle = formData.eventTitle;
            }

            await createReport(reportData);
            router.push('/reports?created=true');
        } catch (err) {
            console.error('Error creating report:', err);
            setFormError(err.message || 'Failed to create report. Please try again.');
        }
    };

    const handleBack = () => {
        router.push('/reports');
    };

    // Menampilkan loading screen saat data belum siap
    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Jika user tidak terautentikasi atau tidak memiliki hak akses
    if (!user || user.role !== 'ATTENDEE') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Reports
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-center p-4 pt-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
                    {/* Left Panel */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white md:w-5/12 flex flex-col justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Need Help?</h2>
                            <p className="text-blue-100 mb-8">We're here to assist you with any issues or questions you may have.</p>
                        </div>
                        <div className="hidden md:block space-y-4 mt-10">
                            {[{ title: 'Quick Response', desc: 'We aim to respond to all reports within 24 hours' },
                                { title: 'Expert Support', desc: 'Our team is trained to help with all types of issues' },
                                { title: 'Track Progress', desc: 'Monitor the status of your report in real-time' }].map((item, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="bg-blue-500 p-2 rounded-full">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="font-medium">{item.title}</h3>
                                        <p className="text-blue-200 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="p-8 md:p-12 md:w-7/12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Support Report</h2>
                        <p className="text-gray-500 mb-6">Tell us about your issue and we'll help you resolve it</p>

                        {(formError || error) && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {formError || error}
                            </div>
                        )}

                        {/* Step Indicator */}
                        <div className="mb-8 flex items-center justify-between">
                            {[1, 2].map((s, i) => (
                                <div key={s} className="flex items-center">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {s}
                                    </div>
                                    {i === 0 && (
                                        <div className={`h-1 w-10 md:w-20 mx-2 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-4">
                                            Is this report related to a specific event? (Optional)
                                        </label>

                                        {formData.eventId && formData.eventTitle && (
                                            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-purple-600 mr-2" />
                                                    <span className="text-sm font-medium text-purple-800">
                                                        Pre-selected: {formData.eventTitle}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <select
                                            value={formData.eventId || ''}
                                            onChange={handleEventChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={loadingEvents}
                                        >
                                            <option value="">General Report (Not event-specific)</option>
                                            {events.map((event) => (
                                                <option key={event.id} value={event.id}>
                                                    {event.title}
                                                </option>
                                            ))}
                                        </select>

                                        {loadingEvents && (
                                            <p className="text-sm text-gray-500 mt-1">Loading events...</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-4">
                                            What type of issue are you experiencing? <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-3">
                                            {categories.map((category) => (
                                                <div
                                                    key={category.value}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                        formData.category === category.value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            value={category.value}
                                                            checked={formData.category === category.value}
                                                            onChange={handleChange}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                        />
                                                        <div className="ml-3">
                                                            <label className="text-sm font-medium text-gray-900 cursor-pointer">
                                                                {category.label}
                                                            </label>
                                                            <p className="text-sm text-gray-500">{category.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={goToNextStep}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                                    >
                                        Continue
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="description" className="block text-gray-700 text-sm font-medium mb-2">
                                            Describe your issue in detail <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={6}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Please provide as much detail as possible about your issue. Include any relevant information such as error messages, transaction IDs, event names, etc."
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Minimum 10 characters. Current: {formData.description.length}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="ml-3 space-y-1">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Selected Category:</strong> {categories.find(c => c.value === formData.category)?.label}
                                                </p>
                                                {formData.eventId && (
                                                    <p className="text-sm text-blue-700">
                                                        <strong>Related Event:</strong> {formData.eventTitle}
                                                    </p>
                                                )}
                                                <p className="text-sm text-blue-600 mt-1">
                                                    {categories.find(c => c.value === formData.category)?.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={goToPreviousStep}
                                            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Creating...
                                                </>
                                            ) : (
                                                'Submit Report'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Need immediate assistance?{' '}
                                <a href="mailto:support@eventsphere.com" className="text-blue-600 hover:underline">
                                    Contact us directly
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
