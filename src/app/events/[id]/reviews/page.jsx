'use client';

import { useEffect, useState, useCallback } from 'react';
import { useReview } from '@/app/contexts/ReviewContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams } from 'next/navigation';
import ReviewItem from '@/app/components/ReviewItem';
import Link from 'next/link';
import { FaStar, FaSearch } from 'react-icons/fa';

export default function EventReviewsPage() {
  const params = useParams();
  const [eventId, setEventId] = useState(null);
  const { user } = useAuth();
  const {
    reviews,
    loading,
    error,
    pagination,
    averageRating,
    getReviewsByEventId,
    getAverageRating,
    searchReviews
  } = useReview();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // State to hold current display reviews to prevent flickering
  const [displayReviews, setDisplayReviews] = useState([]);
  // Use a ref to track if data is currently loading to prevent UI jumps
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Set the event ID from params
  useEffect(() => {
    if (params?.id) {
      setEventId(parseInt(params.id));
    }
  }, [params]);

  // Load reviews when parameters change, but with better control for UI stability
  const loadReviews = useCallback(async () => {
    if (!eventId || !user) return;

    // Only show loading indicator on initial load
    if (isInitialLoad) {
      // Keep displaying old reviews until new ones are loaded
      await Promise.all([
        getReviewsByEventId(eventId, page, pageSize, sortBy),
        getAverageRating(eventId)
      ]);
      setIsInitialLoad(false);
    } else {
      // Fetch data but don't change UI until complete
      const newReviews = await getReviewsByEventId(eventId, page, pageSize, sortBy);

      // Only update displayed reviews when we actually have new data
      if (newReviews && newReviews.length > 0) {
        setDisplayReviews(newReviews);
      }

      // Also update the rating without UI flicker
      await getAverageRating(eventId);
    }
  }, [eventId, page, sortBy, user, getReviewsByEventId, getAverageRating, isInitialLoad, pageSize]);

  // Effect to load reviews when parameters change
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Update display reviews when the real reviews change
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      setDisplayReviews(reviews);
    }
  }, [reviews]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      searchReviews(eventId, searchKeyword, 0, pageSize);
      setPage(0);
    } else {
      getReviewsByEventId(eventId, 0, pageSize, sortBy);
      setPage(0);
    }
  }, [searchKeyword, eventId, pageSize, sortBy, searchReviews, getReviewsByEventId]);

  const handleClearSearch = useCallback(() => {
    setSearchKeyword('');
    getReviewsByEventId(eventId, 0, pageSize, sortBy);
    setPage(0);
  }, [eventId, pageSize, sortBy, getReviewsByEventId]);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
    setPage(0);
  }, []);

  const refreshReviews = useCallback(() => {
    getReviewsByEventId(eventId, page, pageSize, sortBy);
    getAverageRating(eventId);
  }, [eventId, page, pageSize, sortBy, getReviewsByEventId, getAverageRating]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Reviews</h1>
        <Link href={`/events/${eventId}`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Back to Event
          </button>
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Authentication Check */}
      {!user ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Please log in to view reviews. <Link href="/login" className="underline">Login here</Link>
        </div>
      ) : (
        <>
          {/* Review Stats */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <FaStar className="text-yellow-500 mr-1" />
              <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
            </div>
            <span className="mx-2">•</span>
            <span>{pagination.totalItems} reviews</span>
            <Link href={`/events/${eventId}/reviews/create`} className="ml-auto">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Write a Review
              </button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full p-2 border rounded-l"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    ×
                  </button>
                )}
              </div>
              <button type="submit" className="bg-blue-600 text-white p-2 rounded-r">
                <FaSearch />
              </button>
            </form>

            <div className="flex items-center">
              <label htmlFor="sortBy" className="mr-2">Sort by:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={handleSortChange}
                className="border p-2 rounded"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Loading State with Skeleton or Previous Reviews */}
          {isInitialLoad && loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border p-4 rounded-lg animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Reviews List */}
              {displayReviews.length > 0 ? (
                <div className="space-y-4">
                  {displayReviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      refreshReviews={refreshReviews}
                      eventId={eventId}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews found.</p>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className={`mx-1 px-3 py-1 rounded ${page === 0 ? 'bg-gray-200' : 'bg-blue-600 text-white'}`}
              >
                Previous
              </button>
              <div className="mx-2 px-3 py-1">
                Page {page + 1} of {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages - 1}
                className={`mx-1 px-3 py-1 rounded ${page === pagination.totalPages - 1 ? 'bg-gray-200' : 'bg-blue-600 text-white'}`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
