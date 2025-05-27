'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReview } from '../../../contexts/ReviewContext';
import { useAuth } from '../../../contexts/AuthContext';
import { FaStar } from 'react-icons/fa';
import Link from 'next/link';

export default function EditReviewPage({ params: paramsPromise }) {
  const params = React.use(paramsPromise);
  const reviewId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { user, token } = useAuth();
  const {
    updateReview,
    deleteReviewImage,
    uploadReviewImages,
    canEditReview,
    getReviewById,
    loading: contextLoading,
    error: contextError
  } = useReview();

  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[EditReviewPage] useEffect triggered. isLoading:', isLoading, 'Review ID:', reviewId, 'User:', user);

    if (!reviewId) {
      console.error('[EditReviewPage] No review ID found in params.');
      setFormError('Review ID not found.');
      setIsLoading(false);
      return;
    }

    if (!user) {
      console.log('[EditReviewPage] User not authenticated. Redirecting to login.');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    setIsLoading(true);
    console.log('[EditReviewPage] Set isLoading to true at start of fetch logic.');

    const fetchReviewData = async () => {
      console.log('[EditReviewPage] fetchReviewData started for reviewId:', reviewId);
      try {
        console.log('[EditReviewPage] Calling getReviewById from context...');
        const reviewData = await getReviewById(reviewId);
        console.log('[EditReviewPage] Review data fetched successfully:', reviewData);

        console.log('[EditReviewPage] Calling canEditReview from context...');
        const isUserAllowedToEdit = await canEditReview(reviewId);
        console.log('[EditReviewPage] canEditReview result:', isUserAllowedToEdit);

        if (!isUserAllowedToEdit) {
          console.log('[EditReviewPage] User not allowed to edit this review. Redirecting...');
          setFormError('You are not permitted to edit this review, or the editing period has expired.');
          setReview(null);
          setIsLoading(false);
          console.log('[EditReviewPage] Set isLoading to false (user not allowed to edit).');
          setTimeout(() => {
            const redirectPath = reviewData?.eventId ? `/events/${reviewData.eventId}/reviews` : (eventId ? `/events/${eventId}/reviews` : '/reviews');
            console.log('[EditReviewPage] Redirecting to:', redirectPath);
            router.push(redirectPath);
          }, 3000);
          return;
        }

        console.log('[EditReviewPage] User is allowed to edit. Setting review state.');
        setReview(reviewData);
        setRating(reviewData.rating);
        setContent(reviewData.content);
        setExistingImages(reviewData.images || []);
        setFormError('');

      } catch (err) {
        console.error('[EditReviewPage] Error during fetchReviewData:', err);
        setFormError(err.message || 'An error occurred while loading review data.');
        setReview(null);
      } finally {
        setIsLoading(false);
        console.log('[EditReviewPage] fetchReviewData finally block. isLoading set to false.');
      }
    };

    fetchReviewData();
  }, [reviewId, user, router, canEditReview, getReviewById, eventId, token]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImageFiles.length + files.length > 3) {
      setFormError('You can upload a maximum of 3 images in total.');
      return;
    }
    setFormError('');

    const imagePreviews = files.map(file => URL.createObjectURL(file));
    setNewImages(prev => [...prev, ...imagePreviews]);
    setNewImageFiles(prev => [...prev, ...files]);
  };

  const handleDeleteExistingImage = async (imageIdToDelete) => {
    setFormError('');
    try {
      await deleteReviewImage(imageIdToDelete);
      setExistingImages(prev => prev.filter(img => img.id !== imageIdToDelete));
    } catch (err) {
      console.error('Failed to delete image:', err);
      setFormError(err.message || 'Failed to delete image.');
    }
  };

  const handleDeleteNewImage = (indexToDelete) => {
    setNewImages(prev => prev.filter((_, index) => index !== indexToDelete));
    setNewImageFiles(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    if (!review) {
      setFormError('Review data is not loaded yet.');
      setIsLoading(false);
      return;
    }
    if (rating === 0) {
      setFormError('Please provide a rating.');
      setIsLoading(false);
      return;
    }
    if (!content.trim()) {
      setFormError('Please provide some content for your review.');
      setIsLoading(false);
      return;
    }

    try {
      const reviewUpdateData = {
        eventId: review.eventId,
        ticketId: review.ticketId,
        content: content,
        rating: rating,
      };

      console.log('[EditReviewPage] Submitting update with data:', reviewUpdateData);
      const updatedReview = await updateReview(reviewId, reviewUpdateData);

      if (newImageFiles.length > 0) {
        console.log('[EditReviewPage] Uploading new images...');
        await uploadReviewImages(updatedReview.id || reviewId, newImageFiles);
      }

      console.log('[EditReviewPage] Review update successful. Redirecting...');
      const redirectPath = updatedReview?.eventId ? `/events/${updatedReview.eventId}/reviews` : (eventId ? `/events/${eventId}/reviews` : '/reviews');
      router.push(redirectPath);

    } catch (err) {
      console.error('[EditReviewPage] Error submitting review update:', err);
      setFormError(err.message || 'Failed to update review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !review) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Loading review details...</div>
      </div>
    );
  }

  if (!isLoading && !review && formError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
        <p className="mb-4">{formError}</p>
        <Link href={eventId ? `/events/${eventId}/reviews` : "/reviews"} className="text-blue-500 hover:underline">
          Go back to reviews
        </Link>
      </div>
    );
  }

  if (!review) {
     return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-semibold">Preparing review editor...</div>
         {formError && <p className="text-red-500 mt-2">{formError}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Your Review</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        {formError && <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded">{formError}</p>}

        <div className="mb-6">
          <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">Event</label>
          <input
            type="text"
            id="eventTitle"
            value={review.event?.title || `Event ID: ${review.eventId}` }
            readOnly
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`cursor-pointer text-3xl ${
                  (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => handleRatingChange(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            rows="6"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Share your experience..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Images (Max 3)</label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group">
                <img src={image.imageUrl} alt="Existing review image" className="w-full h-32 object-cover rounded-md shadow-md" />
                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(image.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  X
                </button>
              </div>
            ))}
            {newImages.map((imagePreview, index) => (
              <div key={index} className="relative group">
                <img src={imagePreview} alt="New review image preview" className="w-full h-32 object-cover rounded-md shadow-md" />
                <button
                  type="button"
                  onClick={() => handleDeleteNewImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          {(existingImages.length + newImages.length) < 3 && (
            <div className="mt-4">
              <input
                type="file"
                id="images"
                multiple
                accept="image/jpeg, image/png"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Link href={eventId ? `/events/${eventId}/reviews` : (review?.eventId ? `/events/${review.eventId}/reviews` : "/reviews")}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || contextLoading}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || contextLoading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading || contextLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
      {contextError && <p className="text-red-500 text-center mt-4">{contextError}</p>}
    </div>
  );
}

