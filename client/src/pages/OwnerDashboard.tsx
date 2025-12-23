import React, { useState } from 'react';
import { Plus, Edit, Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { MOCK_HOTELS, MOCK_BOOKINGS } from '../data/mockData';
import { Hotel, Booking } from '../types';

interface OwnerDashboardProps {
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string | number) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onCreate, onEdit }) => {
  // In a real app, you would fetch this from an API
  const [listings] = useState<Hotel[]>(MOCK_HOTELS.slice(0, 2));
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const handleBookingAction = (id: string, status: 'accepted' | 'declined') => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };


  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Host Dashboard</h1>
        <Button variant="primary" icon={Plus} onClick={onCreate}>Create new listing</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2">Pending Reservations</div>
          <div className="text-3xl font-bold">{pendingBookings.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2">Total Revenue (Nov)</div>
          <div className="text-3xl font-bold">₺45,250</div>
        </div>
      </div>

      {pendingBookings.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Reservation Requests
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{pendingBookings.length} New</span>
          </h2>
          <div className="grid gap-4">
            {pendingBookings.map(booking => (
              <div key={booking.id} className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <div className="flex-1 pl-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg text-gray-900">{booking.guestName}</span>
                    <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">requesting to book</span>
                  </div>
                  <div className="text-gray-700 font-medium mb-1">{booking.hotelTitle}</div>
                  <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      {booking.checkIn} → {booking.checkOut}
                    </span>
                    <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                      Payout: ₺{booking.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleBookingAction(booking.id, 'declined')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Decline
                  </button>
                  <button
                    onClick={() => handleBookingAction(booking.id, 'accepted')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-sm active:transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      <h2 className="text-xl font-semibold mb-4">Your listings</h2>
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
                <td className="p-4 text-gray-600">{hotel.location}</td>
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
    </div>
  );
};