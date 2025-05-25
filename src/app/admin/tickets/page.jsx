'use client';

import { useEffect } from 'react';
import { useTickets } from '@/app/contexts/TicketContext';

export default function AdminTicketPage() {
    const {
        tickets,
        fetchAllTickets,
        deleteTicket,
        loading,
        error,
        formatCurrency,
    } = useTickets();

    useEffect(() => {
        fetchAllTickets().catch(console.error);
    }, []);

    const handleDelete = async (ticketId) => {
        if (!window.confirm('Yakin ingin menghapus tiket ini?')) return;
        try {
            await deleteTicket(ticketId);
            await fetchAllTickets(); // Refresh daftar tiket
        } catch (err) {
            alert(`Gagal menghapus tiket: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Daftar Tiket
            </h1>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {!loading && tickets.length === 0 ? (
                <p style={{ color: 'gray' }}>Tidak ada tiket tersedia.</p>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            style={{
                                border: '1px solid #ccc',
                                padding: '16px',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <p style={{ fontWeight: '600' }}>{ticket.name}</p>
                                <p>Harga: {formatCurrency(ticket.price)}</p>
                                <p>Kuota: {ticket.quota}</p>
                                <p>Kategori: {ticket.category}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(ticket.id)}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Hapus
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


