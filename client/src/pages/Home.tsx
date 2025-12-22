// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { HotelCard } from '../features/hotels/HotelCard';
import { Hotel } from '../types';
import { listingService } from '../services/listingService';

interface HomeProps {
  onHotelClick: (hotel: Hotel) => void;
}

export const HomePage: React.FC<HomeProps> = ({ onHotelClick }) => {
  const [listings, setListings] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getAllListings();
        setListings(data);
      } catch (err: any) {
        console.error('Failed to fetch listings:', err);
        setError(err.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <main className="pb-20">
      {/* Hero */}
      <div className="bg-black text-white pt-12 pb-32 px-8 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="relative z-10 max-w-7xl mx-auto text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
            Find your next stay <br /> comfortably.
          </h1>
          <p className="text-lg md:text-xl text-gray-100 max-w-xl font-medium drop-shadow-md">
            Discover homes, rooms, and unique places to stay.
          </p>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="max-w-7xl mx-auto mt-8 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-6">Featured stays</h2>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Unable to load listings from server. Showing sample data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {listings.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} onClick={onHotelClick} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};