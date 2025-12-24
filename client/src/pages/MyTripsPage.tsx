import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Ban, Home, AlertCircle, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Hotel } from '../types';
import { reservationService } from '../services/reservationService';
import { listingService } from '../services/listingService';
import { authService } from '../services/authService';
import { reviewService } from '../services/reviewService';

interface MyTripsPageProps {
  onTripClick: (tripId: string) => void;
}

interface Reservation {
  _id: { $oid: string } | string;
  user_id: { $oid: string } | string;
  host_id: { $oid: string } | string;
  listing_id: { $oid: string } | string;
  start_date: string;
  end_date: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'past' | 'declined' | 'upcoming';
}

export const MyTripsPage: React.FC<MyTripsPageProps> = ({ onTripClick }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'declined' | 'pending'>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [listings, setListings] = useState<{ [key: string]: Hotel }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Review Modal State
  const [activeReview, setActiveReview] = useState<{ reservation: Reservation; hotel: Hotel } | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reservationReviews, setReservationReviews] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    fetchUserReservations();
  }, []);

  // Helper function to extract string ID from ObjectId format
  const extractId = (id: { $oid: string } | string): string => {
    if (typeof id === 'string') return id;
    return id.$oid;
  };

  const fetchUserReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Please log in to view your trips');
        setLoading(false);
        return;
      }

      // Fetch all reservations for this user using their MongoDB _id
      const reservationsData: Reservation[] = await reservationService.getUserReservations(user.id);
      setReservations(reservationsData);

      // Fetch listing details for each reservation
      const listingIds: string[] = [...new Set(reservationsData.map((r: Reservation) => extractId(r.listing_id)))];
      const listingsMap: { [key: string]: Hotel } = {};

      await Promise.all(
        listingIds.map(async (listingId: string) => {
          try {
            const listing = await listingService.getListingById(listingId);
            listingsMap[listingId] = listing;
          } catch (err) {
            console.error(`Failed to fetch listing ${listingId}:`, err);
          }
        })
      );

      setListings(listingsMap);

      // Check for existing reviews for past reservations
      const pastReservations = reservationsData.filter(r => r.status === 'past');
      const reviewsMap: { [key: string]: any } = {};

      await Promise.all(
        pastReservations.map(async (reservation: Reservation) => {
          try {
            const resId = extractId(reservation._id);
            const review = await reviewService.getReviewByReservation(resId);
            reviewsMap[resId] = review;
          } catch (err: any) {
            // No review found is okay (404)
            if (err.response?.status !== 404) {
              console.error(`Failed to fetch review for reservation:`, err);
            }
          }
        })
      );

      setReservationReviews(reviewsMap);
    } catch (err: any) {
      console.error('Failed to fetch reservations:', err);
      setError(err.response?.data?.error || 'Failed to load your trips');
    } finally {
      setLoading(false);
    }
  };

  const getReservationId = (reservation: Reservation): string => {
    return extractId(reservation._id);
  };

  const categorizeReservations = () => {
    const now = new Date();

    return reservations.filter((res) => {
      const endDate = new Date(res.end_date);

      if (activeTab === 'upcoming') {
        return res.status === 'upcoming' && endDate >= now;
      } else if (activeTab === 'past') {
        return res.status === 'past' || (endDate < now && res.status === 'upcoming');
      } else if (activeTab === 'declined') {
        return res.status === 'declined';
      } else if (activeTab === 'pending') {
        return res.status === 'pending';
      }
      return false;
    });
  };

  const displayedTrips = categorizeReservations();

  const formatDateRange = (inDate: string, outDate: string) => {
    const start = new Date(inDate);
    const end = new Date(outDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          {['upcoming', 'past', 'declined', 'pending'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                px-6 py-3 font-medium text-sm transition-all capitalize whitespace-nowrap
                ${activeTab === tab
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle size={20} className="text-red-400 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-6 p-5 border border-gray-200 rounded-2xl">
                <div className="w-64 h-40 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Content Area */
          <div className="space-y-6">
            {displayedTrips.length > 0 ? (
              displayedTrips.map((reservation: Reservation) => {
                const listingId = extractId(reservation.listing_id);
                const hotel = listings[listingId];

                // If listing data is not available, show a placeholder
                if (!hotel) {
                  return (
                    <div
                      key={getReservationId(reservation)}
                      className="flex flex-col md:flex-row gap-6 p-5 border border-gray-200 rounded-2xl bg-gray-50"
                    >
                      <div className="w-full md:w-64 h-48 md:h-40 shrink-0 rounded-xl bg-gray-300 flex items-center justify-center">
                        <Home size={48} className="text-gray-400" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-500">Listing Unavailable</h3>
                          <p className="text-gray-400 text-sm mt-1">Listing ID: {listingId}</p>
                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="font-medium">
                                {formatDateRange(reservation.start_date, reservation.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-500">Total cost: </span>
                            <span className="font-bold text-gray-700">₺{reservation.total_price}</span>
                          </div>
                          <div className="bg-gray-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-gray-600">
                            {reservation.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={getReservationId(reservation)}
                    className="flex flex-col md:flex-row gap-6 p-5 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow bg-white group cursor-pointer"
                    onClick={() => {
                      onTripClick(getReservationId(reservation));
                    }}
                  >
                    {/* Image Section */}
                    <div className="w-full md:w-64 h-48 md:h-40 shrink-0 rounded-xl overflow-hidden relative">
                      <img
                        src={hotel.images[0]}
                        alt={hotel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm uppercase tracking-wider">
                        {reservation.status}
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{hotel.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">{hotel.city}</p>
                          </div>
                          <div className="hidden md:block bg-gray-100 p-2 rounded-full text-gray-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <ChevronRight size={20} />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <Calendar size={16} className="text-amber-600" />
                            <span className="font-medium">
                              {formatDateRange(reservation.start_date, reservation.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <MapPin size={16} className="text-amber-600" />
                            <span>{hotel.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-gray-500">Total cost: </span>
                          <span className="font-bold text-gray-900">₺{reservation.total_price}</span>
                        </div>

                        {(reservation.status === 'upcoming' || reservation.status === 'pending') && (
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              className="text-sm h-9 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/messages');
                              }}
                            >
                              Message Host
                            </Button>
                          </div>
                        )}
                        {reservation.status === 'past' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="text-sm h-9 px-4"
                              onClick={async (e) => {
                                e.stopPropagation();

                                const resId = getReservationId(reservation);
                                const existingReviewForTrip = reservationReviews[resId];

                                if (existingReviewForTrip) {
                                  // Review exists - open in edit mode
                                  setExistingReview(existingReviewForTrip);
                                  setRating(existingReviewForTrip.rating);
                                  setReviewText(existingReviewForTrip.comment);
                                  setIsEditingReview(true);
                                  setActiveReview({ reservation, hotel });
                                } else {
                                  // No review - open for new review
                                  setExistingReview(null);
                                  setIsEditingReview(false);
                                  setRating(0);
                                  setReviewText('');
                                  setActiveReview({ reservation, hotel });
                                }
                              }}
                            >
                              {reservationReviews[getReservationId(reservation)]
                                ? 'Edit/Delete Review'
                                : 'Write a Review'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {activeTab === 'upcoming' && <Home size={32} className="text-gray-300" />}
                  {activeTab === 'past' && <Calendar size={32} className="text-gray-300" />}
                  {activeTab === 'pending' && <AlertCircle size={32} className="text-gray-300" />}
                  {activeTab === 'declined' && <Ban size={32} className="text-gray-300" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} trips</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-6">
                  {activeTab === 'upcoming'
                    ? "Time to dust off your bags and start planning your next adventure."
                    : activeTab === 'pending'
                      ? "No pending reservations waiting for host approval."
                      : `You haven't ${activeTab === 'past' ? 'completed' : activeTab} any trips yet.`}
                </p>
                {activeTab === 'upcoming' && (
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-600/20">
                    Start Exploring
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Review Modal */}
        {activeReview && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="font-bold text-2xl">{isEditingReview ? 'Edit Your Review' : 'Write a Review'}</h2>
                <button
                  onClick={() => {
                    setActiveReview(null);
                    setExistingReview(null);
                    setIsEditingReview(false);
                    setRating(0);
                    setReviewText('');
                    setReviewError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Property Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <img
                    src={activeReview.hotel.images[0]}
                    alt={activeReview.hotel.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{activeReview.hotel.title}</h3>
                    <p className="text-sm text-gray-500">{activeReview.hotel.city}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateRange(activeReview.reservation.start_date, activeReview.reservation.end_date)}
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    How was your stay?
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={40}
                          className={`${star <= rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-gray-300'
                            } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {rating === 1 && '😞 Poor'}
                      {rating === 2 && '😕 Fair'}
                      {rating === 3 && '😊 Good'}
                      {rating === 4 && '😄 Very Good'}
                      {rating === 5 && '🤩 Excellent'}
                    </p>
                  )}
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Share your experience
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setReviewText(e.target.value);
                      }
                    }}
                    placeholder="Tell us about your stay... What did you love? What could be improved?"
                    className="w-full h-32 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {reviewText.length} / 500 characters
                  </p>
                  {reviewError && (
                    <p className="text-sm text-red-600 mt-2">{reviewError}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 py-3 text-base font-bold rounded-xl"
                    onClick={() => setActiveReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 py-3 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98]"
                    onClick={async () => {
                      if (!activeReview) return;

                      setSubmittingReview(true);
                      setReviewError(null);

                      try {
                        const resId = extractId(activeReview.reservation._id);
                        const hotelId = String(activeReview.hotel.id);

                        if (isEditingReview && existingReview) {
                          // Update existing review
                          const reviewId = typeof existingReview._id === 'string'
                            ? existingReview._id
                            : existingReview._id.$oid;

                          await reviewService.updateReview(reviewId, {
                            rating: rating,
                            comment: reviewText.trim()
                          });

                          alert('Review updated successfully!');
                        } else {
                          // Create new review
                          await reviewService.createReview({
                            reservation_id: resId,
                            property_id: hotelId,
                            rating: rating,
                            comment: reviewText.trim()
                          });

                          alert('Thank you for your review!');
                        }

                        // Success - close modal and reset
                        setActiveReview(null);
                        setExistingReview(null);
                        setIsEditingReview(false);
                        setRating(0);
                        setReviewText('');
                      } catch (error: any) {
                        console.error('Failed to submit review:', error);
                        setReviewError(error.response?.data?.error || 'Failed to submit review. Please try again.');
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    disabled={rating === 0 || reviewText.trim().length === 0 || submittingReview}
                  >
                    {submittingReview
                      ? (isEditingReview ? 'Updating...' : 'Submitting...')
                      : (isEditingReview ? 'Update Review' : 'Submit Review')}
                  </Button>
                  {isEditingReview && existingReview && (
                    <Button
                      variant="outline"
                      className="flex-1 py-3 text-base font-bold rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
                          try {
                            const reviewId = typeof existingReview._id === 'string'
                              ? existingReview._id
                              : existingReview._id.$oid;

                            await reviewService.deleteReview(reviewId);
                            setActiveReview(null);
                            setExistingReview(null);
                            setIsEditingReview(false);
                            setRating(0);
                            setReviewText('');
                            alert('Review deleted successfully');
                          } catch (error: any) {
                            console.error('Failed to delete review:', error);
                            alert(error.response?.data?.error || 'Failed to delete review');
                          }
                        }
                      }}
                    >
                      Delete Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};