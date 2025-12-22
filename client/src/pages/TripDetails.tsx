import React, { useState } from 'react';
import {
    ChevronLeft, Star, MapPin, Calendar, Users,
    CheckCircle2, Grid, Phone, MessageCircle,
    Download, Share2, AlertCircle, X
} from 'lucide-react';
import { Hotel } from '../types';
import { Button } from '../components/Button';

interface TripDetailsProps {
    hotel: Hotel;
    reservation: {
        id: string;
        checkIn: string;
        checkOut: string;
        guests: number;
        price: number;
        status: 'upcoming' | 'past' | 'canceled';
    };
    onBack: () => void;
    onBookAgain: () => void;
    onMessage: () => void;
}

export const TripDetailsPage: React.FC<TripDetailsProps> = ({ hotel, reservation, onBack, onBookAgain, onMessage }) => {
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    const getDaysDifference = (d1: string, d2: string) => {
        if (!d1 || !d2) return 0;
        const diff = Math.abs(new Date(d2).getTime() - new Date(d1).getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateRange = (inDate: string, outDate: string) => {
        const start = new Date(inDate);
        const end = new Date(outDate);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const nights = getDaysDifference(reservation.checkIn, reservation.checkOut);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-green-100 text-green-700 border-green-200';
            case 'past': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'canceled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

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

    // Review Modal
    if (showReviewModal) {
        return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="font-bold text-2xl">Write a Review</h2>
                        <button
                            onClick={() => setShowReviewModal(false)}
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
                                <p className="text-sm text-gray-500">{hotel.location}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDateRange(reservation.checkIn, reservation.checkOut)}
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
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Tell us about your stay... What did you love? What could be improved?"
                                className="w-full h-32 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                {reviewText.length} / 500 characters
                            </p>
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
                                onClick={() => {
                                    // Handle review submission here
                                    console.log('Review submitted:', { rating, reviewText });
                                    setShowReviewModal(false);
                                    setRating(0);
                                    setReviewText('');
                                }}
                                disabled={rating === 0 || reviewText.trim().length === 0}
                            >
                                Submit Review
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-20 font-sans text-gray-900">

            {/* Top Navigation */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium"
                >
                    <div className="p-2 bg-gray-100 group-hover:bg-gray-200 rounded-full transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    <span>Back to trips</span>
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8">

                {/* Status Banner */}
                <div className={`mb-6 p-4 rounded-2xl border ${getStatusColor(reservation.status)} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} />
                        <div>
                            <p className="font-bold capitalize">{reservation.status} Trip</p>
                            <p className="text-sm opacity-80">
                                {reservation.status === 'upcoming' && 'Get ready for your adventure!'}
                                {reservation.status === 'past' && 'Hope you had a great stay!'}
                                {reservation.status === 'canceled' && 'This reservation was canceled.'}
                            </p>
                        </div>
                    </div>
                </div>

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
                            <div className="flex items-center gap-2 text-amber-600 font-bold mb-3 uppercase tracking-wider text-xs">
                                <MapPin size={16} />
                                <span>{hotel.location}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                {hotel.title}
                            </h1>
                            <div className="flex items-center gap-6 text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Star size={18} className="text-black fill-black" />
                                    <span className="font-semibold text-black">{hotel.rating}</span>
                                    <span className="text-gray-400">({hotel.reviews} reviews)</span>
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{hotel.type}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Trip Details Card */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="text-amber-600" size={24} />
                                Your Trip Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl p-5 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Check-in</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(reservation.checkIn)}</p>
                                    <p className="text-sm text-gray-500 mt-1">After 3:00 PM</p>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Check-out</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(reservation.checkOut)}</p>
                                    <p className="text-sm text-gray-500 mt-1">Before 11:00 AM</p>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Duration</p>
                                    <p className="text-lg font-bold text-gray-900">{nights} Night{nights > 1 ? 's' : ''}</p>
                                    <p className="text-sm text-gray-500 mt-1">{formatDateRange(reservation.checkIn, reservation.checkOut)}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Guests</p>
                                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Users size={20} className="text-amber-600" />
                                        {reservation.guests} Guest{reservation.guests > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Host */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-amber-200">
                                    H
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Hosted by {hotel.superhost ? 'Emir' : 'Host'}</h3>
                                    <p className="text-gray-500 text-sm">Response rate: 100%</p>
                                    {hotel.superhost && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                            ⭐ Superhost
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" className="text-sm h-9 px-4 flex items-center gap-2" onClick={onMessage}>
                                    <MessageCircle size={16} />
                                    Message
                                </Button>

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
                            <h3 className="text-lg font-bold mb-6">What this place offers</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                {hotel.amenities.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle2 size={18} className="text-amber-600" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Property Details */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200">
                            <h3 className="text-lg font-bold mb-6">Property Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-bold text-gray-900">{hotel.guests}</p>
                                    <p className="text-sm text-gray-500 mt-1">Guests</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-bold text-gray-900">{hotel.bedrooms}</p>
                                    <p className="text-sm text-gray-500 mt-1">Bedrooms</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-bold text-gray-900">{hotel.beds}</p>
                                    <p className="text-sm text-gray-500 mt-1">Beds</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-2xl font-bold text-gray-900">{hotel.baths}</p>
                                    <p className="text-sm text-gray-500 mt-1">Baths</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reservation Summary Sidebar */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-10">

                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-2">Reservation Summary</h3>
                                    <p className="text-sm text-gray-500">Confirmation #{reservation.id}</p>
                                </div>

                                <hr className="border-gray-100 mb-6" />

                                {/* Price Breakdown */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">₺{hotel.price} × {nights} night{nights > 1 ? 's' : ''}</span>
                                        <span className="font-semibold">₺{hotel.price * nights}</span>
                                    </div>
                                    {reservation.status !== 'canceled' && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Service fee</span>
                                                <span className="font-semibold">₺{Math.round(hotel.price * nights * 0.1)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Taxes</span>
                                                <span className="font-semibold">₺{Math.round(hotel.price * nights * 0.08)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <hr className="border-gray-100 mb-6" />

                                {/* Total */}
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-lg font-bold">Total {reservation.status === 'canceled' ? '(Refunded)' : 'Paid'}</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        ₺{reservation.status === 'canceled' ? 0 : reservation.price.toLocaleString()}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                {reservation.status === 'upcoming' && (
                                    <div className="space-y-3">
                                        <Button variant="outline" className="w-full py-4 text-base font-bold rounded-xl">
                                            Cancel Reservation
                                        </Button>
                                    </div>
                                )}

                                {reservation.status === 'past' && (
                                    <div className="space-y-3">
                                        <Button className="w-full py-4 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98]" onClick={() => setShowReviewModal(true)}>
                                            Write a Review
                                        </Button>
                                        <Button variant="outline" className="w-full py-4 text-base font-bold rounded-xl" onClick={onBookAgain}>
                                            Book Again
                                        </Button>
                                    </div>
                                )}

                                {reservation.status === 'canceled' && (
                                    <Button className="w-full py-4 text-base font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98]" onClick={onBookAgain}>
                                        Book Again
                                    </Button>
                                )}

                                {/* Important Info */}
                                <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-xs text-blue-900 font-semibold mb-2">📋 Important Information</p>
                                    <ul className="text-xs text-blue-800 space-y-1">
                                        <li>• Bring a valid ID for check-in</li>
                                        <li>• Contact host for parking details</li>
                                        <li>• Quiet hours: 10 PM - 8 AM</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
