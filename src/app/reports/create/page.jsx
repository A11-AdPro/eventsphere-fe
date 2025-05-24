'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateReportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { createReport, loading, error, setError } = useReports();

    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        description: ''
    });
    const [formError, setFormError] = useState('');
    const [step, setStep] = useState(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            if (user.role !== 'ATTENDEE') {
                router.push('/login');
                return;
            }
        }
    }, [user, router, authLoading, mounted]);

    const categories = [
        { value: 'PAYMENT', label: 'Payment Issue', description: 'Problems with payments, refunds, or billing' },
        { value: 'TICKET', label: 'Ticket Issue', description: 'Issues with ticket purchase, access, or delivery' },
        { value: 'EVENT', label: 'Event Issue', description: 'Problems related to event details, venue, or scheduling' },
        { value: 'OTHER', label: 'Other Issue', description: 'Any other concerns or questions' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFormError('');
        setError(null);
    };

    const validateStep1 = () => {
        if (!formData.category) {
            setFormError('Please select a category for your report');
            return false;
        }
        return true;
    };

    const goToNextStep = () => {
        if (validateStep1()) {
            setFormError('');
            setStep(2);
        }
    };

    const goToPreviousStep = () => {
        setStep(1);
        setFormError('');
    };

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
            await createReport({
                category: formData.category,
                description: formData.description.trim()
            });

            // Success - redirect to reports list
            router.push('/reports?created=true');
        } catch (err) {
            console.error('Error creating report:', err);
            setFormError(err.message || 'Failed to create report. Please try again.');
        }
    };

    const handleBack = () => {
        router.push('/reports');
    };

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
                            {[
                                { title: 'Quick Response', desc: 'We aim to respond to all reports within 24 hours' },
                                { title: 'Expert Support', desc: 'Our team is trained to help with all types of issues' },
                                { title: 'Track Progress', desc: 'Monitor the status of your report in real-time' },
                            ].map((item, idx) => (
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
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {s}
                                    </div>
                                    {i === 0 && (
                                        <div className={`h-1 w-10 md:w-20 mx-2 ${
                                            step > 1 ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            {step === 1 && (
                                <div className="space-y-6">
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
                                            <div className="ml-3">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Selected Category:</strong> {categories.find(c => c.value === formData.category)?.label}
                                                </p>
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