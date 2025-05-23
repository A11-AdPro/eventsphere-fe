'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        acceptTerms: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const validateStep1 = () => {
        if (!formData.fullName.trim()) {
            setError('Nama lengkap harus diisi');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email harus diisi');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError('Format email tidak valid');
            return false;
        }
        return true;
    };

    const goToNextStep = () => {
        if (validateStep1()) {
            setError('');
            setStep(2);
        }
    };

    const goToPreviousStep = () => {
        setStep(1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { email, password, confirmPassword, fullName, acceptTerms } = formData;

        // Validation
        if (!password) {
            setError('Password harus diisi');
            setLoading(false);
            return;
        }
        if (password.length < 8) {
            setError('Password minimal 8 karakter');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok');
            setLoading(false);
            return;
        }
        if (!acceptTerms) {
            setError('Anda harus menyetujui syarat dan ketentuan');
            setLoading(false);
            return;
        }

        // Data that matches backend RegisterRequest.java
        const result = await register({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            role: 'ATTENDEE', // Default role
        });

        setLoading(false);

        if (result.success) {
            router.push('/login?registered=true');
        } else {
            setError(result.message || 'Registrasi gagal. Silakan coba lagi.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">
                {/* Left Panel */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 md:p-12 text-white md:w-5/12 flex flex-col justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">EventSphere</h2>
                        <p className="text-indigo-100 mb-8">Bergabunglah dan kelola event impian Anda.</p>
                    </div>
                    <div className="hidden md:block space-y-4 mt-10">
                        {[
                            { title: 'Mudah Digunakan', desc: 'Antarmuka intuitif' },
                            { title: 'Aman & Terpercaya', desc: 'Data Anda selalu terlindungi' },
                            { title: 'Fitur Lengkap', desc: 'Semua dalam satu platform' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center">
                                <div className="bg-indigo-500 p-2 rounded-full">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium">{item.title}</h3>
                                    <p className="text-indigo-200 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="p-8 md:p-12 md:w-7/12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Buat Akun Baru</h2>
                    <p className="text-gray-500 mb-6">Lengkapi formulir berikut untuk mendaftar</p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {/* Step Indicator */}
                    <div className="mb-8 flex items-center justify-between">
                        {[1, 2].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {s}
                                </div>
                                {i === 0 && <div className={`h-1 w-10 md:w-20 mx-2 ${step > 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-6">
                                <InputField 
                                    label="Nama Lengkap" 
                                    id="fullName" 
                                    value={formData.fullName} 
                                    onChange={handleChange} 
                                    placeholder="Masukkan nama lengkap"
                                />
                                <InputField 
                                    label="Email" 
                                    id="email" 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="contoh@email.com"
                                />
                                <button
                                    type="button"
                                    onClick={goToNextStep}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                                >
                                    Lanjutkan
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <InputField 
                                    label="Password" 
                                    id="password" 
                                    type="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputField 
                                    label="Konfirmasi Password" 
                                    id="confirmPassword" 
                                    type="password" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    placeholder="Ulangi password"
                                />
                                <div className="flex items-start">
                                    <input 
                                        id="acceptTerms" 
                                        name="acceptTerms" 
                                        type="checkbox" 
                                        checked={formData.acceptTerms}
                                        onChange={handleChange} 
                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                    />
                                    <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                                        Saya menyetujui <a href="#" className="text-indigo-600 hover:underline">syarat dan ketentuan</a>
                                    </label>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={goToPreviousStep}
                                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                                        disabled={loading}
                                    >
                                        {loading ? 'Memproses...' : 'Daftar Sekarang'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-8">
                        Sudah punya akun?{' '}
                        <Link href="/login" className="text-indigo-600 hover:underline">Login di sini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Input component for reusability
function InputField({ id, label, type = 'text', value, onChange, placeholder }) {
    return (
        <div>
            <label htmlFor={id} className="block text-gray-700 text-sm font-medium mb-2">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
            />
        </div>
    );
}