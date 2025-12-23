import React, { useState, useEffect } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { Hotel } from '../types';
import { HotelCard } from '../features/hotels/HotelCard';
import { searchService } from '../services/searchService';

interface SearchPageProps {
  searchTerm: string;
  searchMode: 'standard' | 'ai';
  onHotelClick: (hotel: Hotel) => void;
}

// Capitalize first letter of each word
const capitalize = (str: string): string => {
  if (!str) return str;
  return str
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Transform backend listing to frontend Hotel type
const transformListingToHotel = (listing: any): Hotel => {
  return {
    id: listing._id?.$oid || listing._id || Math.random(),
    title: listing.title || `${capitalize(listing.property_type || 'Property')} in ${capitalize(listing.city || 'Unknown')}`,
    location: capitalize(listing.city || 'Unknown'),
    type: capitalize(listing.property_type || 'apartment'),
    guests: listing.details?.guests || 1,
    bedrooms: listing.details?.rooms || 1,
    beds: listing.details?.beds || 1,
    baths: listing.details?.bathrooms || 1,
    price: listing.price?.max_per_night || listing.price?.min_per_night || 0,
    rating: listing.rating || 4.5,
    reviews: listing.reviews || 0,
    superhost: listing.superhost || false,
    images: listing.images || [],
    amenities: listing.amenities ? Object.keys(listing.amenities).filter(key => listing.amenities[key] === true).map(capitalize) : [],
    description: listing.description || '',
    nearby: listing.nearby || undefined,
  };
};

export const SearchPage: React.FC<SearchPageProps> = ({ searchTerm, searchMode, onHotelClick }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (searchMode === 'ai') {
          response = await searchService.aiSearch(searchTerm);
        } else {
          // If searchTerm is empty in standard mode, we might want to fetch all or return empty
          // For now, let's assume empty search term returns nothing or handles gracefully
          if (!searchTerm) {
            setHotels([]);
            setIsLoading(false);
            return;
          }
          response = await searchService.normalSearch(searchTerm);
        }

        if (response.listings) {
          // Transform backend listings to frontend Hotel type
          const transformedHotels = response.listings
            .filter((listing: any) => listing.status === 'approved')  // Only show approved listings
            .map(transformListingToHotel);
          setHotels(transformedHotels);
        } else {
          console.error("Unexpected response format:", response);
          setHotels([]);
        }

      } catch (err) {
        console.error("Search failed:", err);
        setError("Failed to fetch search results. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [searchTerm, searchMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
        <button className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-sm hover:border-black transition-colors whitespace-nowrap">
          <Filter size={14} /> Filters
        </button>
        <button className="border border-gray-300 rounded-full px-4 py-2 text-sm hover:border-black transition-colors whitespace-nowrap">Price</button>
        <button className="border border-gray-300 rounded-full px-4 py-2 text-sm hover:border-black transition-colors whitespace-nowrap">Type of place</button>
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
          {isLoading ? 'Searching...' : `${hotels.length} stays found`}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-rose-500" size={48} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-red-500 mb-2">Something went wrong</div>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {hotels.length > 0 ? (
            hotels.map(hotel => (
              <HotelCard key={hotel.id} hotel={hotel} onClick={onHotelClick} />
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <h3 className="text-xl font-medium text-gray-900">No matches found</h3>
              <p className="text-gray-500">Try changing your filters or search area.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
