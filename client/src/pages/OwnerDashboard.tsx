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
  host_id: { $oid: string } | string;
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

      // Fetch all reservations for this host
      const reservationsData: Reservation[] = await reservationService.getHostReservations(user.id);
      setReservations(reservationsData);

      // Fetch listing details for each reservation
      const listingIds: string[] = [...new Set(reservationsData.map((r: Reservation) => extractId(r.listing_id)))];
      const listingsMapTemp: { [key: string]: Hotel } = {};

      await Promise.all(
        listingIds.map(async (listingId: string) => {
          try {
            const listing = await listingService.getListingById(listingId);
            listingsMapTemp[listingId] = listing;
          } catch (err) {
            console.error(`Failed to fetch listing ${listingId}:`, err);
          }
        })
      );

      setListingsMap(listingsMapTemp);

      // Fetch host's own listings
      try {
        const hostListings = await listingService.getHostListings(user.id);
        setListings(hostListings);
      } catch (err) {
        console.error('Failed to fetch host listings:', err);
        // If fetching host listings fails, fall back to listings from reservations
        setListings(Object.values(listingsMapTemp));
      }
    } catch (err: any) {
      console.error('Failed to fetch host data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const pendingBookings = reservations.filter(r => r.status === 'pending');

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
                Reservation Requests
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingBookings.length} New</span>
              </h2>
              <div className="grid gap-4">
                {pendingBookings.map(booking => {
                  const listingId = extractId(booking.listing_id);
                  const listing = listingsMap[listingId];
                  const reservationId = extractId(booking._id);
                  const isProcessing = actionLoading === reservationId;

                  return (
                    <div key={reservationId} className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                      <div className="flex-1 pl-2">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-lg text-gray-900">{listing?.title || 'Loading...'}</span>
                          <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">pending approval</span>
                        </div>
                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            {formatDateRange(booking.start_date, booking.end_date)}
                          </span>
                          <span>
                            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                          </span>
                          <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                            Payout: ₺{booking.total_price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                          onClick={() => handleBookingAction(reservationId, 'decline')}
                          disabled={isProcessing}
                          className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={16} /> Decline
                        </button>
                        <button
                          onClick={() => handleBookingAction(reservationId, 'approve')}
                          disabled={isProcessing}
                          className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-sm active:transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check size={16} /> {isProcessing ? 'Processing...' : 'Accept'}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                        <button onClick={() => onEdit(hotel.id)} className="text-amber-600 font-medium hover:underline flex items-center gap-1">
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
        </>
      )}
    </div>
  );
};