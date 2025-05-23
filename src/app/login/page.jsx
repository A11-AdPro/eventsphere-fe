'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Separate component for the search params logic
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Show success message if user just registered
        if (searchParams.get('registered') === 'true') {
            setShowSuccess(true);
            // Remove the parameter from URL
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    useEffect(() => {
        // Redirect user based on role after login
        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    router.push('/admin');
                    break;
                case 'ORGANIZER':
                    router.push('/organizer');
                    break;
                case 'ATTENDEE':
                    router.push('/attendee');
                    break;
                default:
                    router.push('/dashboard');
            }
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Email dan password harus diisi');
            setLoading(false);
            return;
        }

        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            setError(result.message || 'Login gagal. Periksa email dan password Anda.');
        }
        // User will be redirected by useEffect after login
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
                {/* Left Panel */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white md:w-5/12 flex flex-col justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">EventSphere</h2>
                        <p className="text-blue-100">Platform manajemen event terbaik untuk semua kebutuhan acara Anda</p>
                    </div>
                    <div className="hidden md:block mt-12">
                        <p className="text-blue-200 text-sm">
                            "EventSphere membantu saya mengelola semua event dengan mudah dan profesional."
                        </p>
                        <div className="flex items-center mt-4">
                            <div className="h-8 w-8 rounded-full bg-blue-400"></div>
                            <div className="ml-3">
                                <p className="text-white text-sm font-medium">A11</p>
                                <p className="text-blue-200 text-xs">Event Manager</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="p-8 md:p-12 md:w-7/12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Selamat Datang Kembali</h2>
                    <p className="text-gray-500 mb-6">Silakan login untuk melanjutkan</p>

                    {showSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            Registrasi berhasil! Silakan login dengan akun Anda.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contoh@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                required
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                            >
                                {loading ? 'Memproses...' : 'Masuk'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Belum punya akun?{' '}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Loading fallback component
function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        </div>
    );
}

// Main component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}