// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { HotelCard } from '../features/hotels/HotelCard';
import { Hotel } from '../types';
import { listingService } from '../services/listingService';
import { FilterDropdown } from '../components/FilterDropdown';

interface HomeProps {
  onHotelClick: (hotel: Hotel) => void;
  searchQuery?: string; // ✅ Real-time search query
}

export const HomePage: React.FC<HomeProps> = ({ onHotelClick, searchQuery }) => {
  const [listings, setListings] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [guests, setGuests] = useState<number | null>(null);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // ✅ Filter listings based on search query (check word starts too)
  const filteredListings = searchQuery
    ? listings.filter(hotel => {
      const query = searchQuery.toLowerCase();
      const title = hotel.title.toLowerCase();
      const city = hotel.city.toLowerCase();

      // Check if any word starts with the query
      const titleWords = title.split(' ');
      const cityWords = city.split(' ');

      return title.includes(query) ||
        city.includes(query) ||
        titleWords.some(word => word.startsWith(query)) ||
        cityWords.some(word => word.startsWith(query));
    })
    : listings;

  // Apply additional filters
  const doubleFilteredListings = filteredListings.filter(hotel => {
    if (propertyType && hotel.property_type.toLowerCase() !== propertyType.toLowerCase()) return false;
    if (guests && hotel.details?.guests && hotel.details.guests < guests) return false;
    if (bedrooms && hotel.details?.rooms && hotel.details.rooms < bedrooms) return false;
    return true;
  });

  // Apply sorting
  const sortedListings = [...doubleFilteredListings].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedListings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedListings = sortedListings.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, propertyType, guests, bedrooms, sortBy]);

  const propertyTypeOptions = [
    { label: 'Apartment', value: 'apartment' },
    { label: 'House', value: 'house' },
    { label: 'Villa', value: 'villa' },
    { label: 'Studio', value: 'studio' },
    { label: 'Hotel', value: 'hotel' },
    { label: 'Hostel', value: 'hostel' },
  ];

  const sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating' },
  ];

  const guestOptions = [
    { label: '1+ Guest', value: 1 },
    { label: '2+ Guests', value: 2 },
    { label: '3+ Guests', value: 3 },
    { label: '4+ Guests', value: 4 },
  ];

  const bedroomOptions = [
    { label: '1+ Bedroom', value: 1 },
    { label: '2+ Bedrooms', value: 2 },
    { label: '3+ Bedrooms', value: 3 },
    { label: '4+ Bedrooms', value: 4 },
  ];

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
        {/* Filters Section */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <FilterDropdown
            label="Type of place"
            options={propertyTypeOptions}
            value={propertyType}
            onChange={(value) => setPropertyType(value as string)}
          />

          <FilterDropdown
            label="Guests"
            options={guestOptions}
            value={guests}
            onChange={(value) => setGuests(value as number)}
          />

          <FilterDropdown
            label="Bedrooms"
            options={bedroomOptions}
            value={bedrooms}
            onChange={(value) => setBedrooms(value as number)}
          />

          <div className="border-l border-gray-300 h-6 mx-1"></div>

          {/* Sort By Dropdown */}
          <FilterDropdown
            label="Sort by"
            options={sortOptions}
            value={sortBy}
            onChange={(value) => setSortBy(value as any)}
          />

          <div className="border-l border-gray-300 h-6 mx-1"></div>

          <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
            {loading ? 'Loading...' : `${sortedListings.length} stays`}
          </div>
        </div>

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
            {paginatedListings.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} onClick={onHotelClick} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && sortedListings.length > 0 && totalPages > 1 && (
          <div className="mt-12 px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, sortedListings.length)}</span> of{' '}
              <span className="font-medium">{sortedListings.length}</span> stays
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2);

                  if (showEllipsis) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }

                  if (!showPage) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                        ? 'bg-black text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};