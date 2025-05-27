'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketContext';
import { useEvents } from '../contexts/EventContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react';

function PaymentForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    selectedTicket,
    fetchTicketById,
    userBalance,
    purchaseTicket,
    topUpBalance,
    formatCurrency,
    getTicketCategoryColor,
    loading: ticketLoading,
    error: ticketError
  } = useTickets();

  const {
    selectedEvent,
    fetchEventById,
    formatDate
  } = useEvents();
  
  const ticketId = searchParams.get('ticketId');
  
  const [paymentStep, setPaymentStep] = useState('review');
  const [paymentError, setPaymentError] = useState('');
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [showTopUp, setShowTopUp] = useState(false);

  // Check authentication
  useEffect(() => {
    console.log('Auth check:', { authLoading, user });
    if (!authLoading && (!user || user.role !== 'ATTENDEE')) {
      console.log('Redirecting to login - user not authenticated or not attendee');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Redirect if no ticket ID
  useEffect(() => {
    if (!ticketId) {
      console.log('No ticketId, redirecting to events');
      router.push('/events');
    }
  }, [ticketId, router]);

  // Fetch ticket and event details
  useEffect(() => {
    if (ticketId && user) {
      console.log('Fetching ticket with ID:', ticketId);
      fetchTicketById(parseInt(ticketId))
        .then((ticket) => {
          console.log('Fetched ticket:', ticket);
          if (ticket && ticket.eventId) {
            console.log('Fetching event with ID:', ticket.eventId);
            fetchEventById(ticket.eventId);
          }
        })
        .catch((error) => {
          console.error('Error fetching ticket:', error);
        });
    }
  }, [ticketId, user]);

  const handleBack = () => {
    if (selectedEvent) {
      router.push(`/events/${selectedEvent.id}`);
    } else {
      router.push('/events');
    }
  };

  const handlePurchase = async () => {
    if (userBalance < selectedTicket.price) {
      setShowTopUp(true);
      return;
    }

    try {
      setPaymentStep('processing');
      setPaymentError('');
      
      const result = await purchaseTicket(parseInt(ticketId));
      setPurchaseResult(result);
      setPaymentStep('success');
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStep('error');
    }
  };

  const handleTopUpSuccess = () => {
    setShowTopUp(false);
    if (userBalance >= selectedTicket?.price) {
      handlePurchase();
    }
  };

  const handleContinueShopping = () => {
    router.push('/events');
  };

  const handleViewTickets = () => {
    router.push('/transactions');
  };

  if (authLoading || ticketLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
          
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ATTENDEE') {
    return null; 
  }

  if (ticketError || !selectedTicket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-2xl mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-4">The ticket you're trying to purchase doesn't exist or is no longer available.</p>
        
          {/* Test API Call Button */}
          <div className="mb-4">
            <button
              onClick={async () => {
                try {
                  console.log('Testing direct API call...');
                  const token = localStorage.getItem('token');
                  const response = await fetch(`http://34.193.71.203/api/transactions/purchase/ticket/${ticketId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  console.log('Direct API Response Status:', response.status);
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Direct API Response Data:', data);
                    alert('Direct API call successful! Check console for details.');
                  } else {
                    const errorText = await response.text();
                    console.log('Direct API Error:', errorText);
                    alert(`Direct API call failed: ${response.status} - ${errorText}`);
                  }
                } catch (error) {
                  console.error('Direct API Error:', error);
                  alert(`Direct API call error: ${error.message}`);
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg mr-4"
            >
              Test Direct API Call
            </button>
            
            <button
              onClick={() => router.push('/events')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Events
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (selectedTicket.soldOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Sold Out</h2>
          <p className="text-gray-600 mb-4">Sorry, this ticket is no longer available for purchase.</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Event
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paymentStep === 'review' && (
          <PaymentReview
            ticket={selectedTicket}
            event={selectedEvent}
            user={user}
            userBalance={userBalance}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getTicketCategoryColor={getTicketCategoryColor}
            onPurchase={handlePurchase}
            onTopUp={() => setShowTopUp(true)}
          />
        )}

        {paymentStep === 'processing' && (
          <PaymentProcessing />
        )}

        {paymentStep === 'success' && (
          <PaymentSuccess
            result={purchaseResult}
            ticket={selectedTicket}
            event={selectedEvent}
            user={user}
            formatCurrency={formatCurrency}
            onContinueShopping={handleContinueShopping}
            onViewTickets={handleViewTickets}
          />
        )}

        {paymentStep === 'error' && (
          <PaymentError
            error={paymentError}
            onRetry={handlePurchase}
            onBack={() => setPaymentStep('review')}
          />
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={handleTopUpSuccess}
          requiredAmount={selectedTicket.price - userBalance}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

const PaymentReview = ({ 
  ticket, 
  event, 
  user,
  userBalance, 
  formatCurrency, 
  formatDate, 
  getTicketCategoryColor, 
  onPurchase, 
  onTopUp 
}) => {
  const hasEnoughBalance = userBalance >= ticket.price;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
        <p className="text-gray-600">Review your order details before proceeding</p>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
        
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <h3 className="font-semibold text-gray-900 mr-2">{ticket.name}</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium border ${getTicketCategoryColor(ticket.category)}`}>
                {ticket.category}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(ticket.price)}
            </div>
          </div>
          
          {event && (
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Event:</strong> {event.title}</p>
              <p><strong>Date:</strong> {formatDate(event.eventDate)}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Organizer:</strong> {event.organizerName}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(ticket.price)}</span>
          </div>
        </div>
      </div>

      {/* Simple Purchase Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <p><strong>Your Balance:</strong> {formatCurrency(userBalance)}</p>
          <p><strong>Ticket Price:</strong> {formatCurrency(ticket.price)}</p>
        </div>

        {hasEnoughBalance ? (
          <button
            onClick={onPurchase}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Purchase Ticket - {formatCurrency(ticket.price)}
          </button>
        ) : (
          <button
            onClick={onTopUp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Top Up Balance First
          </button>
        )}
      </div>
    </div>
  );
};

const PaymentProcessing = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
    <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
  </div>
);

const PaymentSuccess = ({ result, ticket, user, formatCurrency, onContinueShopping, onViewTickets }) => (
  <div className="text-center py-12">
    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
    <p className="text-gray-600 mb-6">Your ticket has been purchased successfully</p>
    
    <div className="space-y-3">
      <button onClick={onViewTickets} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg">
        View My Tickets
      </button>
      <button onClick={onContinueShopping} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg">
        Continue Shopping
      </button>
    </div>
  </div>
);

const PaymentError = ({ error, onRetry, onBack }) => (
  <div className="text-center py-12">
    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h2>
    <p className="text-red-700 mb-6">{error}</p>
    
    <div className="space-y-3">
      <button onClick={onRetry} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg">
        Try Again
      </button>
      <button onClick={onBack} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg">
        Back to Review
      </button>
    </div>
  </div>
);

const TopUpModal = ({ onClose, requiredAmount, formatCurrency }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h2 className="text-xl font-bold mb-4">Top Up Required</h2>
      <p className="mb-4">You need {formatCurrency(requiredAmount)} more to purchase this ticket.</p>
      <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded">
        Close
      </button>
    </div>
  </div>
);

function PaymentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentForm />
    </Suspense>
  );
}