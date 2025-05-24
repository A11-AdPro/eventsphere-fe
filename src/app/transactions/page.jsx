'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransaction } from '../contexts/TransactionContext';
import { useTopUp } from '../contexts/TopUpContext'; 
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const {
    transactions,
    loading,
    error,
    fetchCurrentUserTransactions,
    getTransactionsByType,
    getTransactionsByStatus,
    formatCurrency,
    formatDate,
    getTransactionTypeDisplay,
    getTransactionStatusDisplay,
    getStatusColorClass,
    getTypeColorClass,
    setError
  } = useTransaction();

  const { balance } = useTopUp();

  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp_desc');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ATTENDEE')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let filtered = transactions;

    if (filterType !== 'ALL') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(transaction => transaction.status === filterStatus);
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'timestamp_asc':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'timestamp_desc':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'amount_low':
          return a.amount - b.amount;
        case 'amount_high':
          return b.amount - a.amount;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, filterType, filterStatus, sortBy]);

  const handleRefresh = async () => {
    try {
      await fetchCurrentUserTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'TOP_UP':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'TICKET_PURCHASE':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getAmountDisplay = (transaction) => {
    const isPositive = transaction.type === 'TOP_UP';
    const prefix = isPositive ? '+' : '-';
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix}{formatCurrency(transaction.amount)}
      </span>
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
              <p className="text-gray-600 mt-1">Lihat semua aktivitas transaksi Anda</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Transaksi
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="TOP_UP">Top Up</option>
                <option value="TICKET_PURCHASE">Pembelian Tiket</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="SUCCESS">Berhasil</option>
                <option value="FAILED">Gagal</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="timestamp_desc">Terbaru</option>
                <option value="timestamp_asc">Terlama</option>
                <option value="amount_high">Jumlah Tertinggi</option>
                <option value="amount_low">Jumlah Terendah</option>
                <option value="type">Jenis Transaksi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Transaction Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Changed from "Total Top Up" to "Saldo" */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pembelian</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    getTransactionsByType('TICKET_PURCHASE')
                      .filter(t => t.status === 'SUCCESS')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Riwayat Transaksi ({filteredTransactions.length})
            </h2>
          </div>

          {loading && filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Memuat transaksi...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Transaksi</h3>
              <p className="text-gray-600">
                {(filterType !== 'ALL' || filterStatus !== 'ALL') 
                  ? 'Tidak ditemukan transaksi yang sesuai dengan filter'
                  : 'Belum ada transaksi yang dilakukan'
                }
              </p>
              {(filterType !== 'ALL' || filterStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterStatus('ALL');
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Transaction Icon */}
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description || getTransactionTypeDisplay(transaction.type)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColorClass(transaction.type)}`}>
                            {getTransactionTypeDisplay(transaction.type)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(transaction.timestamp)}</span>
                          <span>•</span>
                          <span className="font-mono">ID: {transaction.id?.substring(0, 8)}...</span>
                          {transaction.eventId && (
                            <>
                              <span>•</span>
                              <span>Event: {transaction.eventId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {getAmountDisplay(transaction)}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(transaction.status)}`}>
                          {getTransactionStatusDisplay(transaction.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More / Pagination (if needed) */}
        {filteredTransactions.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            <p>Menampilkan {filteredTransactions.length} transaksi dari {transactions.length} total transaksi</p>
          </div>
        )}
      </div>
    </div>
  );
}