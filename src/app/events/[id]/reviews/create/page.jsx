'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useReview } from '../../../../contexts/ReviewContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { FaStar } from 'react-icons/fa';
import Link from 'next/link';

export default function CreateReviewPage() {
  const params = useParams();
  const eventId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { createReview, uploadReviewImages, loading: reviewLoading, error: reviewError, getMyTicketsForEvent, validateTicketForReview } = useReview();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/events/${eventId}/reviews/create`);
      return;
    }

    const fetchTickets = async () => {
      try {
        if (typeof getMyTicketsForEvent !== 'function') {
          setFormError("Unable to check your tickets. Please try again later.");
          return;
        }

        const myTickets = await getMyTicketsForEvent(eventId);
        console.log("Available tickets for review:", myTickets);

        const validTickets = myTickets && myTickets.length > 0
          ? myTickets.filter(ticket => {
              const isValid = ticket.status === "COMPLETED" ||
                           ticket.status === "USED" ||
                           ticket.status === "VALID";

              const ticketEventId = typeof ticket.eventId === 'string'
                ? parseInt(ticket.eventId)
                : ticket.eventId;

              const currentEventId = typeof eventId === 'string'
                ? parseInt(eventId)
                : eventId;

              return isValid && ticketEventId === currentEventId;
            })
          : [];

        console.log(`Found ${validTickets.length} valid tickets for event ID ${eventId}`);
        setTickets(validTickets);

        if (validTickets.length > 0) {
          setSelectedTicketId(validTickets[0].id || '');
        } else {
          console.log("No valid tickets found for user for this event to review.");
        }
      } catch (err) {
        console.error('Error fetching user tickets for review:', err);
        setFormError(err.message || 'Could not fetch your ticket information for this event.');
      }
    };

    fetchTickets();
  }, [user, eventId, router, getMyTicketsForEvent]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 3 || files.length + images.length > 3) {
      setFormError('You can upload a maximum of 3 images');
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setFormError('Some files were rejected. Please use JPEG or PNG images under 5MB.');
    }

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages([...images, ...newImages]);
    setImageFiles([...imageFiles, ...validFiles]);
    setFormError('');
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newImageFiles = [...imageFiles];

    URL.revokeObjectURL(newImages[index].preview);

    newImages.splice(index, 1);
    newImageFiles.splice(index, 1);

    setImages(newImages);
    setImageFiles(newImageFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (rating === 0) {
      setFormError('Please select a rating');
      return;
    }

    if (!selectedTicketId) {
      setFormError('Please select a valid ticket to review this event');
      return;
    }

    try {
      if (typeof validateTicketForReview === 'function') {
        const isValid = await validateTicketForReview(eventId, selectedTicketId);
        if (!isValid) {
          setFormError('This ticket is not valid for reviewing this event');
          return;
        }
      }

      const reviewData = {
        eventId: parseInt(eventId),
        ticketId: selectedTicketId,
        content,
        rating
      };

      const createdReview = await createReview(reviewData);

      if (imageFiles.length > 0) {
        await uploadReviewImages(createdReview.id, imageFiles);
      }

      router.push(`/events/${eventId}/reviews?created=true`);
    } catch (err) {
      setFormError(err.message || 'Failed to create review');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Write a Review</h1>

      {tickets.length === 0 ? (
        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-100 text-yellow-800 p-6 rounded-lg mb-6 shadow-md">
          <h2 className="font-bold text-xl mb-3">You cannot review this event</h2>
          <p className="mb-3">You need to have a valid ticket for this event to write a review.</p>
          <p className="mb-4">Please purchase a ticket and attend the event before submitting a review.</p>
          <div className="flex space-x-3">
            <Link href={`/events/${eventId}`}>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Event Details
              </button>
            </Link>
            <Link href={`/events/${eventId}/reviews`}>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors">
                Back to Reviews
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
          {(formError || reviewError) && (
            <p className="text-red-500 text-sm mb-6 bg-red-50 border border-red-100 p-3 rounded">{formError || reviewError}</p>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Ticket:
            </label>
            <select
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a ticket</option>
              {tickets.map(ticket => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticketType} - {new Date(ticket.purchaseDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the ticket you used to attend this event
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`cursor-pointer text-3xl ${
                    star <= (hoverRating || rating) 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select a rating'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="content">
              Your Review
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="6"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Share your experience at this event..."
              required
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (Max 3)
            </label>

            {images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 3 && (
              <div className="mt-2">
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png"
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  disabled={images.length >= 3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPEG or PNG only, max 5MB each
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <Link href={`/events/${eventId}/reviews`}>
              <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={reviewLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {reviewLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
