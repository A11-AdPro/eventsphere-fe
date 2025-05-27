'use client';

import { useState, useEffect } from 'react';
import { useReview } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { FaStar, FaEdit, FaTrash, FaFlag, FaReply, FaImage } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

const ReviewItem = ({ review, onUpdate, eventId }) => {
  const { user } = useAuth();
  const { reportReview, deleteReview, respondToReview, hideReview, restoreReview, canEditReview } = useReview();

  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [canBeEdited, setCanBeEdited] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Updated function to use the new imageUrl field directly from the backend
  const getReviewImageUrl = (image) => {
    // For debugging
    console.log('[ReviewItem] Processing image:', image);

    try {
      // Case 1: Backend has properly populated the imageUrl field as expected in the new implementation
      if (image && image.imageUrl) {
        // The new backend implementation provides a relative path like /review-images/filename.jpg
        // We need to prepend the base URL
        if (image.imageUrl.startsWith('/')) {
          return `http://localhost:8080${image.imageUrl}`;
        }
        return image.imageUrl;
      }

      // Case 2: Direct string URL from backend
      if (typeof image === 'string') {
        if (image.startsWith('/')) {
          return `http://localhost:8080${image}`;
        }
        return image;
      }

      // Case 3: Legacy format - has ID but missing imageUrl
      if (image && image.id) {
        // Construct URL based on new backend path structure
        return `http://localhost:8080/review-images/${image.id}`;
      }

      // Default placeholder
      return '/placeholder-image.jpg';
    } catch (e) {
      console.error('[ReviewItem] Error processing image URL:', e);
      return '/placeholder-image.jpg';
    }
  };

  // Improved error handling for images
  const handleImageError = (index) => {
    console.warn(`[ReviewItem] Image at index ${index} failed to load`);
    setImageErrors(prev => ({...prev, [index]: true}));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const checkEditEligibility = async () => {
      const actualReviewUserId = review?.user?.id || review?.userId;
      console.log('[ReviewItem] Checking edit eligibility for review ID:', review?.id, 'User ID:', user?.id, 'Review User ID (actual):', actualReviewUserId);

      if (!review?.id || !user?.id || typeof actualReviewUserId === 'undefined') {
        console.log('[ReviewItem] Missing review ID, user ID, or actualReviewUserId. Cannot edit.');
        setCanBeEdited(false);
        return;
      }

      const isOwner = String(user.id) === String(actualReviewUserId);
      console.log(`[ReviewItem] Is owner? Current User ID ${user.id} vs Review User ID ${actualReviewUserId} -> ${isOwner}`);

      if (isOwner) {
        console.log('[ReviewItem] User is owner. Checking time limit via canEditReview...');
        const isEditableByTime = await canEditReview(review.id);
        console.log(`[ReviewItem] Time limit check for review ${review.id} (canEditReview result): ${isEditableByTime}`);
        setCanBeEdited(isEditableByTime);
      } else {
        console.log('[ReviewItem] User is not owner. Cannot edit.');
        setCanBeEdited(false);
      }
    };

    if (review && user) {
      checkEditEligibility();
    } else {
      setCanBeEdited(false);
    }
  }, [user, review, canEditReview]);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason) return;

    try {
      await reportReview(review.id, reportReason);
      setIsReporting(false);
      setReportReason('');
      alert('Review reported successfully');
    } catch (error) {
      alert(`Error reporting review: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(review.id);
        if (onUpdate) onUpdate();
        alert('Review deleted successfully');
      } catch (error) {
        alert(`Error deleting review: ${error.message}`);
      }
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!responseContent) return;

    try {
      await respondToReview(review.id, responseContent);
      setIsResponding(false);
      setResponseContent('');
      if (onUpdate) onUpdate();
      alert('Response added successfully');
    } catch (error) {
      alert(`Error responding to review: ${error.message}`);
    }
  };

  const handleHideReview = async () => {
    if (window.confirm('Are you sure you want to hide this review?')) {
      try {
        await hideReview(review.id);
        if (onUpdate) onUpdate();
        alert('Review hidden successfully');
      } catch (error) {
        alert(`Error hiding review: ${error.message}`);
      }
    }
  };

  const handleRestoreReview = async () => {
    try {
      await restoreReview(review.id);
      if (onUpdate) onUpdate();
      alert('Review restored successfully');
    } catch (error) {
      alert(`Error restoring review: ${error.message}`);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-5 border border-gray-200 ${review.hidden ? 'opacity-70 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-lg text-gray-800">{review.userName}</h4>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                size={18}
              />
            ))}
            <span className="ml-2 text-gray-600 text-sm">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>

        {/* Review Actions */}
        <div className="flex space-x-3">
          {/* Show images button if review has images */}
          {review.images && review.images.length > 0 && (
            <button
              className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
              onClick={() => setShowImages(!showImages)}
              title="Show/Hide Images"
            >
              <FaImage className="mr-1" />
              <span className="text-sm">{showImages ? 'Hide' : 'Show'} Images</span>
            </button>
          )}

          {/* Edit button - only shows if user is owner AND review is within time limit */}
          {canBeEdited && (
            <Link href={`/reviews/edit/${review.id}?eventId=${eventId}`} className="inline-block">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center transition-colors"
                title="Edit Review"
              >
                <FaEdit className="mr-1" />
                <span>Edit</span>
              </button>
            </Link>
          )}

          {/* Delete button - for review owner or admin */}
          {(String(user?.id) === String(review?.user?.id || review?.userId) || user?.role === 'ADMIN') && (
            <button
              className="flex items-center text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors"
              onClick={handleDelete}
              title="Delete Review"
            >
              <FaTrash className="mr-1" />
              <span className="text-sm">Delete</span>
            </button>
          )}

          {/* Report button - for any authenticated user except own reviews */}
          {user && String(user.id) !== String(review?.user?.id || review?.userId) && (
            <button
              className={`flex items-center ${isReporting ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'} hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-md transition-colors`}
              onClick={() => setIsReporting(!isReporting)}
              title="Report Review"
            >
              <FaFlag className="mr-1" />
              <span className="text-sm">{isReporting ? 'Cancel' : 'Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Review</label>
        <p className="text-gray-700">{review.content}</p>
      </div>

      {/* Review Images */}
      {showImages && review.images && review.images.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Images ({review.images.length})</label>
          <div className="grid grid-cols-3 gap-3">
            {review.images.map((image, index) => {
              // Pre-compute the URL to avoid errors during rendering
              const imageUrl = getReviewImageUrl(image);
              console.log(`[ReviewItem] Image ${index} URL: ${imageUrl}`);

              return (
                <div key={index} className="relative h-28 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                  {!imageErrors[index] ? (
                    <img
                      src={imageUrl}
                      alt={`Review image ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => handleImageError(index)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-200 p-2">
                      <FaImage className="text-gray-400 mb-1" size={20} />
                      <span className="text-xs text-gray-500 text-center">Image unavailable</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Organizer Response */}
      {review.organizerResponse && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mt-4 mb-3">
          <h5 className="font-semibold text-blue-800 mb-1">Response from Organizer</h5>
          <p className="text-gray-700">{review.organizerResponse.content}</p>
          <span className="text-gray-500 text-xs block mt-2">
            {formatDate(review.organizerResponse.createdAt)}
          </span>
        </div>
      )}

      {/* Report Form */}
      {isReporting && (
        <form onSubmit={handleReport} className="mt-4 border-t pt-4">
          <h5 className="font-semibold mb-2 text-gray-800">Report this Review</h5>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Reason for reporting</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              rows="3"
              placeholder="Please explain why you're reporting this review..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2 transition-colors"
              onClick={() => setIsReporting(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}

      {/* Organizer Response Form */}
      {isResponding && (
        <form onSubmit={handleRespond} className="mt-4 border-t pt-4">
          <h5 className="font-semibold mb-2 text-gray-800">Respond to this Review</h5>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Your response</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              rows="3"
              placeholder="Write your response to this review..."
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2 transition-colors"
              onClick={() => setIsResponding(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Submit Response
            </button>
          </div>
        </form>
      )}

      {/* Warning if review is hidden */}
      {review.hidden && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mt-3 text-sm rounded-md flex items-center">
          <FaFlag className="mr-2" />
          This review has been hidden by an administrator.
        </div>
      )}

      {/* Reported status indicator */}
      {review.reported && user?.role === 'ADMIN' && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-3 mt-3 text-sm rounded-md flex items-center">
          <FaFlag className="mr-2" />
          This review has been reported and is pending moderation.
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
