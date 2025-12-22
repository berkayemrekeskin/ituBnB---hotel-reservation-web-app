import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, Ban, Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Hotel } from '../types';
import { reservationService } from '../services/reservationService';
import { listingService } from '../services/listingService';
import { authService } from '../services/authService';

interface MyTripsPageProps {
  onTripClick: (hotel: Hotel, reservation: any) => void;
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
  status: 'pending' | 'past' | 'cancelled' | 'upcoming';
}

export const MyTripsPage: React.FC<MyTripsPageProps> = ({ onTripClick }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'pending'>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [listings, setListings] = useState<{ [key: string]: Hotel }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const startDate = new Date(res.start_date);

      if (activeTab === 'upcoming') {
        return res.status === 'upcoming' && startDate >= now;
      } else if (activeTab === 'past') {
        return res.status === 'past' || (endDate < now && res.status === 'upcoming');
      } else if (activeTab === 'cancelled') {
        return res.status === 'cancelled';
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
          {['upcoming', 'past', 'cancelled', 'pending'].map((tab) => (
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
                if (!hotel) return null;

                return (
                  <div
                    key={getReservationId(reservation)}
                    className="flex flex-col md:flex-row gap-6 p-5 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow bg-white group cursor-pointer"
                    onClick={() => {
                      // Transform reservation data to match TripDetailsPage expected format
                      const transformedReservation = {
                        id: getReservationId(reservation),
                        checkIn: reservation.start_date,
                        checkOut: reservation.end_date,
                        guests: reservation.guests,
                        price: reservation.total_price,
                        status: reservation.status === 'cancelled' ? 'canceled' : reservation.status as 'upcoming' | 'past' | 'canceled'
                      };
                      onTripClick(hotel, transformedReservation);
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
                            <p className="text-gray-500 text-sm mt-1">{hotel.location}</p>
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
                            <span>{hotel.location}</span>
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
                            <Button variant="ghost" className="text-sm h-9 px-3">Message Host</Button>
                          </div>
                        )}
                        {reservation.status === 'past' && (
                          <Button variant="outline" className="text-sm h-9 px-4">Write a Review</Button>
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
                  {activeTab === 'cancelled' && <Ban size={32} className="text-gray-300" />}
                  {activeTab === 'pending' && <AlertCircle size={32} className="text-gray-300" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} trips</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-6">
                  {activeTab === 'upcoming'
                    ? "Time to dust off your bags and start planning your next adventure."
                    : activeTab === 'pending'
                      ? "No pending reservations waiting for host approval."
                      : `You haven't ${activeTab === 'past' ? 'past' : 'completed'} any trips yet.`}
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
      </main>
    </div>
  );
};