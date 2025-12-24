import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Star, MapPin,
  Minus, Plus, Grid, CheckCircle2,
  Utensils, Train, ShoppingBag, Trees, Landmark, X
} from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Hotel, BookingDetails } from '../types';
import { Button } from '../components/Button';
import { listingService } from '../services/listingService';
import { DatePickerPanel } from '../components/DatePickerPanel';
import { reviewService, ReviewWithUser } from '../services/reviewService';
import { reservationService } from '../services/reservationService';

const NEARBY_CONFIG = {
  attractions: { icon: Landmark, label: "Attractions" },
  public_transport: { icon: Train, label: "Public Transport" },
  restaurants: { icon: Utensils, label: "Restaurants" },
  shopping_centers: { icon: ShoppingBag, label: "Shopping Centers" },
  parks: { icon: Trees, label: "Parks" }
};

interface DetailPageProps {
  hotel?: Hotel;
  onBack?: () => void;
  onBook: (hotel: Hotel, details: BookingDetails) => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({ hotel: propHotel, onBack, onBook }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState<Hotel | null>(propHotel || location.state?.hotel || null);
  const [loading, setLoading] = useState(!hotel);
  const [error, setError] = useState<string | null>(null);

  /* State */
  const [checkIn, setCheckIn] = useState("2025-11-24");
  const [checkOut, setCheckOut] = useState("2025-11-29");
  const [guestCount, setGuestCount] = useState(1);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(6);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [userCompletedReservation, setUserCompletedReservation] = useState<any>(null);
  const [userExistingReview, setUserExistingReview] = useState<any>(null);
  const [hostUsername, setHostUsername] = useState<string>('Host');

  /* Effects */
  useEffect(() => {
    if (!hotel && id) {
      const fetchHotel = async () => {
        try {
          setLoading(true);
          const data = await listingService.getListingById(id);
          setHotel(data);
        } catch (err) {
          console.error("Failed to fetch hotel:", err);
          setError("Failed to load hotel details.");
        } finally {
          setLoading(false);
        }
      };
      fetchHotel();
    }
  }, [id, hotel]);

  // Fetch reviews when hotel is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (hotel?.id) {
        try {
          setLoadingReviews(true);
          const [reviewsData, statsData] = await Promise.all([
            reviewService.getPropertyReviews(String(hotel.id)),
            reviewService.getPropertyStats(String(hotel.id))
          ]);
          setReviews(reviewsData);
          setReviewStats(statsData);
        } catch (err) {
          console.error('Failed to fetch reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      }
    };
    fetchReviews();
  }, [hotel]);

  // Fetch host username
  useEffect(() => {
    const fetchHostUsername = async () => {
      if (!hotel?.id) return;

      try {
        const username = await listingService.getListingHostUsername(String(hotel.id));
        setHostUsername(username);
      } catch (err) {
        console.error('Failed to fetch host username:', err);
      }
    };

    fetchHostUsername();
  }, [hotel]);

  // Check if user has a completed reservation for this property
  useEffect(() => {
    const checkUserReservation = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr || !hotel?.id) return;

      try {
        const user = JSON.parse(userStr);
        const reservations = await reservationService.getUserReservations(user._id || user.id);

        // Find a completed/confirmed reservation for this property
        const completedRes = reservations.find((res: any) => {
          const listingId = typeof res.listing_id === 'string' ? res.listing_id : res.listing_id?.$oid;
          return listingId === String(hotel.id) && ['confirmed', 'completed'].includes(res.status);
        });

        setUserCompletedReservation(completedRes);

        // Check if user already reviewed this reservation
        if (completedRes) {
          try {
            const resId = typeof completedRes._id === 'string' ? completedRes._id : completedRes._id.$oid;
            const existingReview = await reviewService.getReviewByReservation(resId);
            setUserExistingReview(existingReview);
          } catch (err: any) {
            // No review found is okay
            if (err.response?.status !== 404) {
              console.error('Error checking for existing review:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to check user reservations:', err);
      }
    };
    checkUserReservation();
  }, [hotel]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const getDaysDifference = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const diff = Math.abs(new Date(d2).getTime() - new Date(d1).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleDateChange = (start: string | null, end: string | null) => {
    if (start !== null) setCheckIn(start);
    else setCheckIn("");

    if (end !== null) setCheckOut(end);
    else setCheckOut("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-red-600">{error || "Hotel not found"}</h2>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  const nights = getDaysDifference(checkIn, checkOut);
  const total = hotel.price * nights;

  if (showAllPhotos) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in fade-in duration-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-20">
          <button
            onClick={() => setShowAllPhotos(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="font-bold text-lg">Photo Gallery</span>
          <div className="w-10"></div>
        </div>
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          {hotel.images.map((img, idx) => (
            <div key={idx} className="rounded-2xl overflow-hidden shadow-sm">
              <img src={img} className="w-full h-auto object-cover" alt={`Gallery ${idx}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="font-bold text-2xl">Write a Review</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
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
                  src={hotel.images[0]}
                  alt={hotel.title}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">{hotel.title}</h3>
                  <p className="text-sm text-gray-500">{hotel.city}</p>
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
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 py-3 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98]"
                  onClick={async () => {
                    if (!hotel || !userCompletedReservation) return;

                    setSubmittingReview(true);
                    setReviewError(null);

                    try {
                      const resId = typeof userCompletedReservation._id === 'string'
                        ? userCompletedReservation._id
                        : userCompletedReservation._id.$oid;

                      await reviewService.createReview({
                        reservation_id: resId,
                        property_id: String(hotel.id),
                        rating: rating,
                        comment: reviewText.trim()
                      });

                      // Success - close modal and reset
                      setShowReviewModal(false);
                      setRating(0);
                      setReviewText('');

                      // Refresh reviews
                      const [reviewsData, statsData] = await Promise.all([
                        reviewService.getPropertyReviews(String(hotel.id)),
                        reviewService.getPropertyStats(String(hotel.id))
                      ]);
                      setReviews(reviewsData);
                      setReviewStats(statsData);

                      // Mark as reviewed
                      const review = await reviewService.getReviewByReservation(resId);
                      setUserExistingReview(review);

                      alert('Thank you for your review!');
                    } catch (error: any) {
                      console.error('Failed to submit review:', error);
                      setReviewError(error.response?.data?.error || 'Failed to submit review. Please try again.');
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  disabled={rating === 0 || reviewText.trim().length === 0 || submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white min-h-screen pb-20 font-sans text-gray-900">

        {/* Top Navigation */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium"
          >
            <div className="p-2 bg-gray-100 group-hover:bg-gray-200 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span>Back to listings</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* Gallery */}
          <div className="mb-10 group cursor-pointer" onClick={() => setShowAllPhotos(true)}>
            <div className="w-full h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-sm relative mb-4">
              <img
                src={hotel.images[0]}
                alt="Main"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2">
                <Grid size={16} /> View all photos
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 h-24 md:h-32">
              {[...hotel.images, ...hotel.images].slice(0, 4).map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden relative">
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                  {i === 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      +{hotel.images.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-10">

              {/* Header Info */}
              <div>
                <div className="flex items-center gap-2 text-orange-600 font-bold mb-3 uppercase tracking-wider text-xs">
                  <MapPin size={16} />
                  <span>{hotel.city}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {hotel.title}
                </h1>
                <div className="flex items-center gap-6 text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star size={18} className="text-black fill-black" />
                    <span className="font-semibold text-black">
                      {reviewStats?.average_rating ? reviewStats.average_rating.toFixed(1) : 'New'}
                    </span>
                    <span className="text-gray-400">
                      ({reviewStats?.total_reviews || 0} {reviewStats?.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{hotel.property_type}</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Host */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Hosted by {hostUsername}</h3>
                  <p className="text-gray-500 text-sm">Response rate: 100%</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg border border-orange-200">
                  H
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold mb-4">About the space</h3>
                <p className="text-gray-600 leading-8 text-lg font-light">
                  {hotel.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Amenities</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {hotel.amenities && Object.entries(hotel.amenities)
                    .filter(([key, value]) => value === true)
                    .map(([key], i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle2 size={18} className="text-orange-600" />
                        <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                </div>

                {/* Property Details */}
                {hotel.details && (
                  <>
                    <hr className="my-8 border-gray-200" />
                    <h3 className="text-lg font-bold mb-6">Property Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-2xl font-bold text-gray-900">{hotel.details.guests}</p>
                        <p className="text-sm text-gray-500 mt-1">Guests</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-2xl font-bold text-gray-900">{hotel.details.rooms}</p>
                        <p className="text-sm text-gray-500 mt-1">Bedrooms</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-2xl font-bold text-gray-900">{hotel.details.beds}</p>
                        <p className="text-sm text-gray-500 mt-1">Beds</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-2xl font-bold text-gray-900">{hotel.details.bathrooms}</p>
                        <p className="text-sm text-gray-500 mt-1">Bathrooms</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Nearby Section */}
                {hotel.nearby && Object.entries(hotel.nearby).some(([key, value]) => value === true) && (
                  <>
                    <hr className="my-8 border-gray-200" />
                    <h3 className="text-lg font-bold mb-6">What's Nearby</h3>
                    <div className="space-y-6">
                      {(Object.entries(NEARBY_CONFIG) as [keyof typeof NEARBY_CONFIG, typeof NEARBY_CONFIG[keyof typeof NEARBY_CONFIG]][]).map(([key, config]) => {
                        const isNearby = hotel.nearby?.[key];
                        if (!isNearby) return null;
                        const Icon = config.icon;

                        return (
                          <div key={key} className="flex gap-4">
                            <div className="mt-1 flex-shrink-0">
                              <Icon className="text-orange-600" size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-1">{config.label}</h4>
                              <p className="text-gray-600 text-sm leading-relaxed">Available nearby</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Reviews */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {reviewStats?.total_reviews > 0
                      ? `Reviews (${reviewStats.total_reviews})`
                      : 'Reviews'}
                  </h3>
                  {userCompletedReservation && !userExistingReview && (
                    <Button
                      onClick={() => setShowReviewModal(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-semibold"
                    >
                      Write a Review
                    </Button>
                  )}
                </div>

                {loadingReviews ? (
                  <div className="text-center py-8 text-gray-500">Loading reviews...</div>
                ) : reviews.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {reviews.slice(0, visibleReviews).map((r) => {
                        const reviewId = typeof r._id === 'string' ? r._id : r._id.$oid;
                        const createdDate = typeof r.created_at === 'string'
                          ? new Date(r.created_at)
                          : new Date(r.created_at.$date);
                        const formattedDate = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                        return (
                          <div key={reviewId} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                                  {r.user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{r.user?.name || 'Anonymous'}</p>
                                  <p className="text-xs text-gray-400">{formattedDate}</p>
                                </div>
                              </div>
                              <div className="flex text-orange-500 gap-0.5">
                                {[...Array(Math.round(r.rating))].map((_, i) => (
                                  <Star key={i} size={14} className="fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">"{r.comment}"</p>
                          </div>
                        );
                      })}
                    </div>

                    {visibleReviews < reviews.length && (
                      <Button
                        variant="outline"
                        className="w-full md:w-auto"
                        onClick={() => setVisibleReviews(prev => prev + 6)}
                      >
                        Show more reviews ({reviews.length - visibleReviews} remaining)
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500">No reviews yet. Be the first to review this property!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-10">

                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">₺{hotel.price}</span>
                      <span className="text-gray-500"> / night</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Star size={16} className="fill-orange-500 text-orange-500" /> {hotel.rating}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-4 mb-8">
                    {/* Unified Date Trigger */}
                    <div className="relative">
                      <div
                        className="p-4 rounded-2xl border border-gray-200 hover:border-orange-500 hover:ring-1 hover:ring-orange-500 transition-all cursor-pointer bg-white"
                        onClick={() => setShowDatePicker(true)}
                      >
                        <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Date</label>
                        <div className="text-sm font-semibold text-gray-900">
                          {checkIn
                            ? (checkOut
                              ? `${new Date(checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                              : `${new Date(checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - Select checkout`
                            )
                            : "Select dates"
                          }
                        </div>
                      </div>

                      {/* Date Picker Modal */}
                      {showDatePicker && (
                        <>
                          <div className="fixed inset-0 z-[55] bg-transparent" onClick={() => setShowDatePicker(false)} />
                          <DatePickerPanel
                            isOpen={showDatePicker}
                            onClose={() => setShowDatePicker(false)}
                            startDate={checkIn || null}
                            endDate={checkOut || null}
                            onChange={handleDateChange}
                            className="absolute top-full right-0 mt-4 w-[350px] md:w-[500px] lg:w-[700px] shadow-2xl z-[60]"
                          />
                        </>
                      )}
                    </div>

                    {/* Guests */}
                    <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Guests</label>
                        <span className="text-sm font-semibold text-gray-900">{guestCount} Guest{guestCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() => setGuestCount(Math.min(hotel.details?.guests || 10, guestCount + 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total Calculation */}
                  <div className="border-t border-gray-100 pt-6 mb-8">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600 font-medium">Total ({nights} nights)</span>
                      <span className="font-bold text-2xl text-gray-900">₺{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Check if dates are in the past */}
                  {checkIn && new Date(checkIn) < new Date(new Date().setHours(0, 0, 0, 0)) ? (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-700 text-center">
                        Cannot book past dates. Please select future dates.
                      </p>
                    </div>
                  ) : null}

                  <Button
                    className="w-full py-4 text-lg font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
                    onClick={() => onBook(hotel, { checkIn, checkOut, guestCount, total })}
                    disabled={!checkIn || !checkOut || (!!checkIn && new Date(checkIn) < new Date(new Date().setHours(0, 0, 0, 0)))}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};