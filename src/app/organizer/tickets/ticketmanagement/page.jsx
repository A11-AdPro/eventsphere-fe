'use client';

import React, { useState, useEffect } from 'react';
import { useTickets } from '../../../contexts/TicketContext'; // sesuaikan path jika perlu

export default function TicketManagementPage() {
    const {
        tickets,
        loading,
        error,
        fetchAllTickets,
        createTicket,
        updateTicket,
        formatCurrency,
        getTicketCategoryColor,
        isTicketAvailable,
        setError,
    } = useTickets();

    // State untuk modal add/update
    const [showModal, setShowModal] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        quota: '',
        category: 'REGULAR',
        eventId: '', // wajib diisi sesuai event
    });
    const [currentTicketId, setCurrentTicketId] = useState(null);

    useEffect(() => {
        fetchAllTickets().catch(console.error);
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            quota: '',
            category: 'REGULAR',
            eventId: '',
        });
        setCurrentTicketId(null);
        setError(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsUpdateMode(false);
        setShowModal(true);
    };

    const openUpdateModal = (ticket) => {
        setFormData({
            name: ticket.name,
            price: ticket.price,
            quota: ticket.quota,
            category: ticket.category,
            eventId: ticket.eventId,
        });
        setCurrentTicketId(ticket.id);
        setIsUpdateMode(true);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'quota' || name === 'eventId' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple validation
        if (!formData.name || !formData.price || !formData.quota || !formData.category || !formData.eventId) {
            alert('Please fill all fields correctly.');
            return;
        }

        try {
            if (isUpdateMode && currentTicketId) {
                await updateTicket(currentTicketId, formData);
                alert('Ticket updated successfully!');
            } else {
                await createTicket(formData);
                alert('Ticket created successfully!');
            }
            setShowModal(false);
            fetchAllTickets();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Ticket Management</h1>
            <button
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={openAddModal}
                disabled={loading}
            >
                Add Ticket
            </button>

            {loading && <p>Loading tickets...</p>}
            {error && <p className="text-red-600 mb-2">{error}</p>}

            <table className="min-w-full border border-gray-300 rounded">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border px-3 py-2 text-left">Name</th>
                    <th className="border px-3 py-2 text-left">Price</th>
                    <th className="border px-3 py-2 text-left">Quota</th>
                    <th className="border px-3 py-2 text-left">Category</th>
                    <th className="border px-3 py-2 text-left">Event ID</th>
                    <th className="border px-3 py-2 text-left">Available</th>
                    <th className="border px-3 py-2 text-left">Actions</th>
                </tr>
                </thead>
                <tbody>
                {tickets.length === 0 && !loading && (
                    <tr>
                        <td colSpan="7" className="text-center p-4">
                            No tickets found.
                        </td>
                    </tr>
                )}
                {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{ticket.name}</td>
                        <td className="border px-3 py-2">{formatCurrency(ticket.price)}</td>
                        <td className="border px-3 py-2">{ticket.quota}</td>
                        <td className={`border px-3 py-2 ${getTicketCategoryColor(ticket.category)} font-semibold`}>
                            {ticket.category}
                        </td>
                        <td className="border px-3 py-2">{ticket.eventId}</td>
                        <td className="border px-3 py-2">{isTicketAvailable(ticket) ? 'Yes' : 'No'}</td>
                        <td className="border px-3 py-2">
                            <button
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => openUpdateModal(ticket)}
                                disabled={loading}
                            >
                                Update Ticket
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded p-6 max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">{isUpdateMode ? 'Update Ticket' : 'Add Ticket'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1" htmlFor="name">Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1" htmlFor="price">Price</label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1" htmlFor="quota">Quota</label>
                                <input
                                    id="quota"
                                    name="quota"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.quota}
                                    onChange={handleChange}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1" htmlFor="category">Category</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                >
                                    <option value="REGULAR">REGULAR</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium mb-1" htmlFor="eventId">Event ID</label>
                                <input
                                    id="eventId"
                                    name="eventId"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.eventId}
                                    onChange={handleChange}
                                    className="w-full border px-2 py-1 rounded"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    disabled={loading}
                                >
                                    {isUpdateMode ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

