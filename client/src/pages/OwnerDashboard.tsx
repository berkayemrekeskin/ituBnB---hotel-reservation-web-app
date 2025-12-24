import React, { useState, useEffect } from 'react';
import { Plus, Edit, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Hotel } from '../types';
import { reservationService } from '../services/reservationService';
import { listingService } from '../services/listingService';
import { authService } from '../services/authService';

interface OwnerDashboardProps {
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string | number) => void;
}

interface Reservation {
  _id: { $oid: string } | string;
  user_id: { $oid: string } | string;
  listing_id: { $oid: string } | string;
  start_date: string;
  end_date: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'upcoming' | 'declined' | 'past';
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onCreate, onEdit }) => {
  const [listings, setListings] = useState<Hotel[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [listingsMap, setListingsMap] = useState<{ [key: string]: Hotel }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchHostData();
  }, []);

  // Helper function to extract string ID from ObjectId format
  const extractId = (id: { $oid: string } | string): string => {
    if (typeof id === 'string') return id;
    return id.$oid;
  };

  const fetchHostData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user (who should be a host)
      const user = authService.getCurrentUser();
      if (!user) {
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      // Step 1: Fetch host's own listings first
      const hostListings = await listingService.getHostListings(user.id);
      setListings(hostListings);

      // Step 2: Get all listing IDs
      const hostListingIds = hostListings.map((listing: Hotel) => {
        const id: any = listing.id;
        return typeof id === 'string' ? id : id?.$oid || String(id);
      });

      // Step 3: Fetch all reservations and filter for this host's listings
      const allReservations = await reservationService.getHostReservations(user.id);

      // Filter reservations that belong to this host's listings
      const hostReservations = allReservations.filter((reservation: any) => {
        const listingId = extractId(reservation.listing_id);
        return hostListingIds.includes(listingId);
      });

      setReservations(hostReservations);

      // Step 4: Create listings map for quick lookup
      const listingsMapTemp: { [key: string]: Hotel } = {};
      hostListings.forEach((listing: Hotel) => {
        const id: any = listing.id;
        const listingId = typeof id === 'string' ? id : id?.$oid || String(id);
        listingsMapTemp[listingId] = listing;
      });
      setListingsMap(listingsMapTemp);

    } catch (err: any) {
      console.error('Failed to fetch host data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const pendingBookings = reservations.filter(r => r.status === 'pending');
  const approvedBookings = reservations.filter(r => r.status === 'upcoming');

  const handleBookingAction = async (reservationId: string, action: 'approve' | 'decline') => {
    try {
      setActionLoading(reservationId);

      if (action === 'approve') {
        await reservationService.approveReservation(reservationId);
      } else {
        await reservationService.declineReservation(reservationId);
      }

      // Refresh data after action
      await fetchHostData();
    } catch (err: any) {
      console.error(`Failed to ${action} reservation:`, err);
      setError(err.response?.data?.error || `Failed to ${action} reservation`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Host Dashboard</h1>
        <Button variant="primary" icon={Plus} onClick={onCreate}>Create new listing</Button>
      </div>



      {loading ? (
        <div className="space-y-6">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-200 h-24 rounded-xl"></div>
            <div className="bg-gray-200 h-24 rounded-xl"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-2">Pending Reservations</div>
              <div className="text-3xl font-bold">{pendingBookings.length}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-2">Total Reservations</div>
              <div className="text-3xl font-bold">{reservations.length}</div>
            </div>
          </div>

          {pendingBookings.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Pending Reservations
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingBookings.length} New</span>
              </h2>
              <div className="bg-white border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b">
                    <tr>
                      <th className="p-4">Property</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Guests</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingBookings.map(booking => {
                      const listingId = extractId(booking.listing_id);
                      const listing = listingsMap[listingId];
                      const reservationId = extractId(booking._id);
                      const isProcessing = actionLoading === reservationId;

                      return (
                        <tr key={reservationId} className="hover:bg-gray-50">
                          <td className="p-4 flex items-center gap-3">
                            {listing?.images?.[0] && (
                              <img src={listing.images[0]} className="w-12 h-12 rounded object-cover" alt="thumb" />
                            )}
                            <span className="font-medium">{listing?.title || 'Loading...'}</span>
                          </td>
                          <td className="p-4 text-gray-600">
                            {formatDateRange(booking.start_date, booking.end_date)}
                          </td>
                          <td className="p-4 text-gray-600">
                            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                          </td>
                          <td className="p-4 font-semibold">₺{booking.total_price.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleBookingAction(reservationId, 'decline')}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X size={14} /> Decline
                              </button>
                              <button
                                onClick={() => handleBookingAction(reservationId, 'approve')}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check size={14} /> {isProcessing ? 'Processing...' : 'Accept'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">Your listings</h2>
          {listings.length > 0 ? (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="p-4">Property</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listings.map(hotel => (
                    <tr key={hotel.id} className="hover:bg-gray-50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={hotel.images[0]} className="w-12 h-12 rounded object-cover" alt="thumb" />
                        <span className="font-medium">{hotel.title}</span>
                      </td>
                      <td className="p-4 text-gray-600">{hotel.city}</td>
                      <td className="p-4">₺{hotel.price}</td>
                      <td className="p-4">
                        <button
                          onClick={() => {
                            // Extract ID from ObjectId format if needed
                            const id: any = hotel.id;
                            const listingId = typeof id === 'string' ? id : id?.$oid || String(id);
                            onEdit(listingId);
                          }}
                          className="text-amber-600 font-medium hover:underline flex items-center gap-1"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No listings found. Create your first listing to get started!</p>
            </div>
          )}

          {/* Approved Reservations Section */}
          <h2 className="text-xl font-semibold mb-4 mt-10">Approved Reservations</h2>
          {approvedBookings.length > 0 ? (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="p-4">Property</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Guests</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {approvedBookings.map(booking => {
                    const listingId = extractId(booking.listing_id);
                    const listing = listingsMap[listingId];
                    const reservationId = extractId(booking._id);
                    const isProcessing = actionLoading === reservationId;

                    return (
                      <tr key={reservationId} className="hover:bg-gray-50">
                        <td className="p-4 flex items-center gap-3">
                          {listing?.images?.[0] && (
                            <img src={listing.images[0]} className="w-12 h-12 rounded object-cover" alt="thumb" />
                          )}
                          <span className="font-medium">{listing?.title || 'Loading...'}</span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {formatDateRange(booking.start_date, booking.end_date)}
                        </td>
                        <td className="p-4 text-gray-600">
                          {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                        </td>
                        <td className="p-4 font-semibold">₺{booking.total_price.toLocaleString()}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleBookingAction(reservationId, 'decline')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={14} /> {isProcessing ? 'Processing...' : 'Cancel'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No approved reservations yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};