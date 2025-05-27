'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReview } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import ReviewItem from '../components/ReviewItem';
import { FaStar, FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function ReviewsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getMyReviews, loading: reviewLoading, error, pagination } = useReview();

  const [myReviews, setMyReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchReviews = async (page = 0) => {
    try {
      const reviews = await getMyReviews(page, 5);
      setMyReviews(reviews || []);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching my reviews:", err);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/reviews');
      return;
    }

    if (user) {
      fetchReviews();
    }
  }, [user, authLoading, router]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchReviews(newPage);
      window.scrollTo(0, 0);
    }
  };

  const refreshReviews = () => {
    fetchReviews(currentPage);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <FaSpinner className="text-blue-600 text-4xl animate-spin mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <Link href="/attendee" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">My Reviews</h1>
        <p className="text-gray-600 mb-6">All reviews you've written for events you've attended.</p>
      </div>

      {reviewLoading ? (
        <div className="flex justify-center p-8">
          <FaSpinner className="text-blue-600 text-2xl animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      ) : myReviews.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-md text-center">
          <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 mb-4">You haven't written any reviews for events yet.</p>
          <Link href="/events">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Browse Events
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="grid gap-6">
              {myReviews.map(review => (
                <div key={review.id} className="bg-white rounded-lg shadow border border-gray-100">
                  <div className="p-4 border-b border-gray-100">
                    <Link href={`/events/${review.eventId}`}>
                      <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800">
                        {review.eventTitle || 'Event'}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500">
                      Posted on {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ReviewItem
                    review={review}
                    onUpdate={refreshReviews}
                    eventId={review.eventId}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`px-3 py-1 rounded-l-md border ${
                    currentPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx)}
                    className={`px-3 py-1 border-t border-b ${
                      currentPage === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages - 1}
                  className={`px-3 py-1 rounded-r-md border ${
                    currentPage === pagination.totalPages - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
