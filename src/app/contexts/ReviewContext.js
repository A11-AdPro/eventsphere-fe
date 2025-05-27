'use client';

import React, { createContext, useContext, useState } from 'react';

const ReviewContext = createContext();

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

// Keep useReviews for backward compatibility
export const useReviews = useReview;

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 0
  });

  const API_BASE_URL = 'http://localhost:8080/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch reviews for an event with pagination and sorting
  const getReviewsByEventId = async (eventId, page = 0, size = 10, sort = 'newest') => {
    try {
      setLoading(true);
      setError(null);

      // Updated to use the correct endpoint from the API docs
      const response = await fetch(`${API_BASE_URL}/reviews/event/${eventId}/paginated?page=${page}&size=${size}&sortBy=${sort}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        // Direct array of reviews
        setReviews(data);
        setPagination({
          totalItems: data.length,
          totalPages: 1,
          currentPage: 0
        });
        return data;
      } else if (data.content && Array.isArray(data.content)) {
        // Spring Boot paginated response format
        setReviews(data.content);
        setPagination({
          totalItems: data.totalElements || data.content.length,
          totalPages: data.totalPages || 1,
          currentPage: data.number || 0
        });
        return data.content;
      } else {
        // Fallback
        setReviews([]);
        setPagination({
          totalItems: 0,
          totalPages: 0,
          currentPage: 0
        });
        return [];
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
      // Set empty state on error
      setReviews([]);
      setPagination({
        totalItems: 0,
        totalPages: 0,
        currentPage: 0
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get average rating for an event
  const getAverageRating = async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      // Updated to use the correct endpoint from the API docs
      const response = await fetch(`${API_BASE_URL}/reviews/event/${eventId}/rating`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch average rating: ${response.status}`);
      }

      const data = await response.json();
      // The API might return the average rating directly or in an object with averageRating property
      const ratingValue = typeof data === 'number' ? data : (data.averageRating || 0);
      setAverageRating(ratingValue);
      return ratingValue;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching average rating:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has purchased the event
  const hasUserPurchasedEvent = async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      // Get the user's transactions
      const response = await fetch(`${API_BASE_URL}/transactions/my-transactions`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const transactions = await response.json();
      console.log('Checking purchases for event:', eventId);
      console.log('User transactions:', transactions);

      // Check if any transaction is for this event
      const hasPurchased = Array.isArray(transactions) && transactions.some(transaction => {
        // Check different ways the event ID might be referenced in the transaction
        const transactionEventId =
          transaction.eventId ||
          (transaction.event && transaction.event.id) ||
          (transaction.ticket && transaction.ticket.eventId);

        // Compare as both string and number to handle potential type differences
        return transactionEventId == eventId;
      });

      console.log('Has purchased event:', hasPurchased);
      return hasPurchased;
    } catch (err) {
      setError(err.message);
      console.error('Error checking purchase status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create a new review
  const createReview = async (eventId, reviewData) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has purchased the event first
      const hasPurchased = await hasUserPurchasedEvent(eventId);

      if (!hasPurchased) {
        throw new Error('You can only review events you have purchased tickets for.');
      }

      // Continue with creating the review if the user has purchased
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...reviewData,
          eventId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create review: ${response.status}`);
      }

      const newReview = await response.json();
      setReviews(prev => [...prev, newReview]);
      return newReview;
    } catch (err) {
      setError(err.message);
      console.error('Error creating review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a review
  const updateReview = async (reviewId, reviewData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update review: ${response.status}`);
      }

      const updatedReview = await response.json();
      setReviews(prev => prev.map(review =>
        review.id === reviewId ? updatedReview : review
      ));
      return updatedReview;
    } catch (err) {
      setError(err.message);
      console.error('Error updating review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete review: ${response.status}`);
      }

      setReviews(prev => prev.filter(review => review.id !== reviewId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews by user
  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // This endpoint might need to be updated based on your API
      const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user reviews: ${response.status}`);
      }

      const data = await response.json();
      setReviews(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user reviews:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Search reviews by keyword - also handles pagination
  const searchReviews = async (eventId, keyword, page = 0, size = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/event/${eventId}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to search reviews: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats similar to getReviewsByEventId
      if (Array.isArray(data)) {
        setReviews(data);
        setPagination({
          totalItems: data.length,
          totalPages: 1,
          currentPage: 0
        });
        return data;
      } else if (data.content && Array.isArray(data.content)) {
        setReviews(data.content);
        setPagination({
          totalItems: data.totalElements || data.content.length,
          totalPages: data.totalPages || 1,
          currentPage: data.number || 0
        });
        return data.content;
      } else {
        setReviews([]);
        setPagination({
          totalItems: 0,
          totalPages: 0,
          currentPage: 0
        });
        return [];
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching reviews:', err);
      setReviews([]);
      setPagination({
        totalItems: 0,
        totalPages: 0,
        currentPage: 0
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Report a review
  const reportReview = async (reviewId, reason) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to report review: ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error reporting review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if a review can be edited (typically limited by time)
  const canEditReview = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/canEdit`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check edit eligibility: ${response.status}`);
      }

      const data = await response.json();
      // The API might return a boolean directly or an object with an editable property
      return typeof data === 'boolean' ? data : (data.editable || false);
    } catch (err) {
      setError(err.message);
      console.error('Error checking edit eligibility:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Respond to a review (for organizers)
  const respondToReview = async (reviewId, content) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to respond to review: ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error responding to review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Hide a review (admin only)
  const hideReview = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/hide`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to hide review: ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error hiding review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Restore a hidden review (admin only)
  const restoreReview = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to restore review: ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error restoring review:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // For backward compatibility
  const fetchEventReviews = getReviewsByEventId;
  const fetchReviewById = async (reviewId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch review: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      console.error('Error fetching review:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    reviews,
    averageRating,
    loading,
    error,
    pagination, // Add pagination to the context value
    getReviewsByEventId,
    getAverageRating,
    createReview,
    updateReview,
    deleteReview,
    fetchUserReviews,
    searchReviews,
    reportReview,
    canEditReview,
    respondToReview,
    hideReview,
    restoreReview,
    // For backward compatibility
    fetchEventReviews,
    fetchReviewById
  };
  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};




