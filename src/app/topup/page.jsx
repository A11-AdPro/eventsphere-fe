'use client';

import { useState, useEffect } from 'react';
import { useTopUp } from '../contexts/TopUpContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const TopUpPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const {
    balance,
    topUpHistory,
    loading,
    error,
    processTopUp,
    fetchBalance,
    formatCurrency,
    formatDate,
    setError
  } = useTopUp();

  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [topUpType, setTopUpType] = useState('FIXED');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fixedAmounts = [50000, 100000, 250000, 500000, 1000000];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ATTENDEE')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    
    const amount = topUpType === 'FIXED' ? selectedAmount : customAmount;
    
    if (!amount || amount <= 0) {
      setError('Silakan pilih atau masukkan jumlah top-up');
      return;
    }

    if (topUpType === 'CUSTOM') {
      const numAmount = parseInt(amount);
      if (numAmount < 10000) {
        setError('Jumlah custom minimal Rp 10.000');
        return;
      }
      if (numAmount > 1000000) {
        setError('Jumlah custom maksimal Rp 1.000.000');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage('');
      
      console.log('Processing top-up:', { amount, topUpType });
      
      const result = await processTopUp(amount, topUpType);
      
      console.log('Top-up result:', result);
      
      setSuccessMessage(`Top-up berhasil! Saldo baru: ${formatCurrency(result.newBalance)}`);
      setSelectedAmount('');
      setCustomAmount('');
      setTopUpType('FIXED');
      
    } catch (error) {
      console.error('Top-up failed:', error);
      setError(error.message || 'Terjadi kesalahan saat memproses top-up');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setTopUpType('FIXED');
    setCustomAmount(''); 
    setError(null);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setTopUpType('CUSTOM');
    setSelectedAmount(''); 
    setError(null);
  };

  const refreshData = async () => {
    try {
      await fetchBalance();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (authLoading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Up Saldo</h1>
          <p className="text-gray-600">Isi saldo untuk membeli tiket acara</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Saldo Saat Ini</h2>
                <button
                  onClick={refreshData}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  disabled={loading}
                >
                  {loading ? '...' : '🔄'}
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-10 w-32 mx-auto rounded"></div>
                  ) : (
                    formatCurrency(balance)
                  )}
                </div>
                <p className="text-sm text-gray-500">Saldo tersedia</p>
              </div>
              
              {/* User Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">User:</span> {user?.fullName || user?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Role:</span> {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Top-up Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Pilih Jumlah Top-up</h2>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-600">{successMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleTopUp}>
                {/* Fixed Amount Options */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Jumlah Tetap</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {fixedAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        disabled={isProcessing}
                        className={`p-3 border rounded-lg text-center transition-colors disabled:opacity-50 ${
                          selectedAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">Jumlah Kustom</h3>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="Masukkan jumlah"
                      min="10000"
                      max="1000000"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum Rp 10.000, Maksimum Rp 1.000.000
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing || loading || (!selectedAmount && !customAmount)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    'Top Up Sekarang'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Top-up History */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Top-up</h2>
            
            {loading && topUpHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Memuat riwayat...</p>
              </div>
            ) : topUpHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">Belum ada riwayat top-up</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID Transaksi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deskripsi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topUpHistory.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono">
                            {transaction.id?.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status === 'SUCCESS' ? 'Berhasil' : 
                             transaction.status === 'FAILED' ? 'Gagal' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.description || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpPage;