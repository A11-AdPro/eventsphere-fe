'use client';

import { useEffect, useState } from 'react';
import { useReview } from '../../../contexts/ReviewContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaStar } from 'react-icons/fa';
import Link from 'next/link';

export default function ReportedReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getReportedReviews, approveReport, rejectReport, hideReview, restoreReview } = useReview();

  const [reportedReviews, setReportedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    // Check if user is admin, otherwise redirect
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (!user) {
      // Wait for auth to load
      return;
    }

    const fetchReportedReviews = async () => {
      try {
        setLoading(true);
        const data = await getReportedReviews();
        setReportedReviews(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportedReviews();
  }, [user, router, getReportedReviews]);

  const handleApproveReport = async (reportId, reviewId) => {
    try {
      setActionInProgress(reportId);
      await approveReport(reportId);
      // Update the local state by removing the approved report
      setReportedReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            reports: review.reports.filter(report => report.id !== reportId),
            hidden: true
          };
        }
        return review;
      }));
    } catch (error) {
      setError(`Failed to approve report: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectReport = async (reportId, reviewId) => {
    try {
      setActionInProgress(reportId);
      await rejectReport(reportId);
      // Update the local state by removing the rejected report
      setReportedReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          const updatedReports = review.reports.filter(report => report.id !== reportId);
          return {
            ...review,
            reports: updatedReports,
            reported: updatedReports.length > 0 // Still reported if there are other reports
          };
        }
        return review;
      }));
    } catch (error) {
      setError(`Failed to reject report: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      setActionInProgress(`hide-${reviewId}`);
      await hideReview(reviewId);
      // Update the local state to reflect the hidden status
      setReportedReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, hidden: true } : review
      ));
    } catch (error) {
      setError(`Failed to hide review: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRestoreReview = async (reviewId) => {
    try {
      setActionInProgress(`restore-${reviewId}`);
      await restoreReview(reviewId);
      // Update the local state to reflect the restored status
      setReportedReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, hidden: false } : review
      ));
    } catch (error) {
      setError(`Failed to restore review: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return null; // Handled by the useEffect redirect
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Reported Reviews</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reported reviews...</p>
        </div>
      ) : reportedReviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No reported reviews at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reportedReviews.map(review => (
            <div key={review.id} className={`bg-white rounded-lg shadow-md p-6 ${review.hidden ? 'opacity-50' : ''}`}>
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    <Link href={`/events/${review.eventId}`}>
                      <span className="text-blue-600 hover:underline">
                        Review for Event #{review.eventId}
                      </span>
                    </Link>
                  </h2>
                  <div className="flex items-center mt-1">
                    <span className="mr-2">By {review.userName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>

                <div>
                  {review.hidden ? (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => handleRestoreReview(review.id)}
                      disabled={actionInProgress === `restore-${review.id}`}
                    >
                      {actionInProgress === `restore-${review.id}` ? 'Working...' : 'Restore Review'}
                    </button>
                  ) : (
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => handleHideReview(review.id)}
                      disabled={actionInProgress === `hide-${review.id}`}
                    >
                      {actionInProgress === `hide-${review.id}` ? 'Working...' : 'Hide Review'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-700">Review Content:</h3>
                <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded">{review.content}</p>
              </div>

              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Review Images:</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {review.images.map((image, i) => (
                      <div key={i} className="aspect-square relative">
                        <img
                          src={image.url}
                          alt={`Review image ${i+1}`}
                          className="h-full w-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Reports ({review.reports.length}):</h3>
                <div className="space-y-3">
                  {review.reports.map(report => (
                    <div key={report.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-gray-800 font-medium">
                            {report.reporterName || 'Anonymous User'}
                          </p>
                          <p className="text-gray-600 text-sm">{formatDate(report.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                            onClick={() => handleApproveReport(report.id, review.id)}
                            disabled={actionInProgress === report.id}
                          >
                            {actionInProgress === report.id ? 'Working...' : 'Approve'}
                          </button>
                          <button
                            className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
                            onClick={() => handleRejectReport(report.id, review.id)}
                            disabled={actionInProgress === report.id}
                          >
                            {actionInProgress === report.id ? 'Working...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 italic">"{report.reason}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {review.hidden && (
                <div className="bg-red-100 text-red-700 p-3 mt-4 rounded-md text-sm">
                  This review is currently hidden from public view.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
