import React, { useState } from 'react';
import { Calendar, MapPin, ChevronRight, Ban, Home } from 'lucide-react';
import { MOCK_HOTELS } from '../data/mockData';
import { Button } from '../components/Button';

// backend based on the User ID
const MOCK_RESERVATIONS = [
  {
    id: 'res_1',
    hotelId: 1,
    checkIn: '2025-12-15',
    checkOut: '2025-12-20',
    status: 'upcoming',
    price: 12500,
    guests: 2
  },
  {
    id: 'res_2',
    hotelId: 1,
    checkIn: '2023-11-10',
    checkOut: '2023-11-12',
    status: 'past',
    price: 5000,
    guests: 1
  },
  {
    id: 'res_3',
    hotelId: 1,
    checkIn: '2024-01-05',
    checkOut: '2024-01-10',
    status: 'canceled',
    price: 0,
    guests: 4
  }
];

export const MyTripsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');
  const displayedTrips = MOCK_RESERVATIONS.filter(res => res.status === activeTab);
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
          {['upcoming', 'past', 'canceled'].map((tab) => (
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

        {/* Content Area */}
        <div className="space-y-6">
          {displayedTrips.length > 0 ? (
            displayedTrips.map((reservation) => {
              const hotel = MOCK_HOTELS.find(h => h.id === reservation.hotelId);
              if (!hotel) return null;

              return (
                <div 
                  key={reservation.id} 
                  className="flex flex-col md:flex-row gap-6 p-5 border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow bg-white group cursor-pointer"
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
                            {formatDateRange(reservation.checkIn, reservation.checkOut)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <MapPin size={16} className="text-amber-600" />
                          <span>{hotel.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions (Show different actions based on status) */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm">
                           <span className="text-gray-500">Total cost: </span>
                           <span className="font-bold text-gray-900">₺{reservation.price}</span>
                        </div>
                        
                        {reservation.status === 'upcoming' && (
                           <div className="flex gap-3">
                              <Button variant="ghost" className="text-sm h-9 px-3">Message Host</Button>
                              <Button className="text-sm h-9 px-4 bg-amber-500 hover:bg-amber-600 border-none">View Details</Button>
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
                {activeTab === 'canceled' && <Ban size={32} className="text-gray-300" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} trips</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">
                {activeTab === 'upcoming' 
                  ? "Time to dust off your bags and start planning your next adventure." 
                  : "You haven't completed any trips yet."}
              </p>
              {activeTab === 'upcoming' && (
                <Button className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-600/20">
                  Start Exploring
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};