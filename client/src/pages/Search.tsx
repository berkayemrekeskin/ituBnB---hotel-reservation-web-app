import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Hotel } from '../types';
import { HotelCard } from '../features/hotels/HotelCard';
import { searchService } from '../services/searchService';
import { FilterDropdown } from '../components/FilterDropdown';

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
    city: capitalize(listing.city || 'Unknown'),
    property_type: capitalize(listing.property_type || 'apartment'),
    details: listing.details || {},
    price: listing.price || 0,
    rating: listing.rating || 4.5,
    reviews: listing.reviews || 0,
    superhost: listing.superhost || false,
    images: listing.images || [],
    amenities: listing.amenities || {},
    description: listing.description || '',
    nearby: listing.nearby || {},
  };
};

export const SearchPage: React.FC<SearchPageProps> = ({ searchTerm, searchMode, onHotelClick }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [guests, setGuests] = useState<number | null>(null);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | null>(null);

  useEffect(() => {
    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (searchMode === 'ai') {
          response = await searchService.aiSearch(searchTerm);
        } else {
          if (!searchTerm) {
            setHotels([]);
            setIsLoading(false);
            return;
          }
          response = await searchService.normalSearch(searchTerm);
        }

        if (response.listings) {
          const transformedHotels = response.listings
            .filter((listing: any) => listing.status === 'approved')
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

  // Apply filters
  const filteredHotels = hotels.filter(hotel => {
    // Property type filter
    if (propertyType && hotel.property_type.toLowerCase() !== propertyType.toLowerCase()) {
      return false;
    }

    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (max && max < 999999) {
        if (hotel.price < min || hotel.price > max) return false;
      } else {
        if (hotel.price < min) return false;
      }
    }

    // Guests filter
    if (guests && hotel.details?.guests && hotel.details.guests < guests) {
      return false;
    }

    // Bedrooms/Rooms filter (using 'rooms' from details)
    if (bedrooms && hotel.details?.rooms && hotel.details.rooms < bedrooms) {
      return false;
    }

    return true;
  });

  // Apply sorting
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const propertyTypeOptions = [
    { label: 'Apartment', value: 'apartment' },
    { label: 'House', value: 'house' },
    { label: 'Villa', value: 'villa' },
    { label: 'Studio', value: 'studio' },
  ];

  const priceOptions = [
    { label: '$0 - $100', value: '0-100' },
    { label: '$100 - $200', value: '100-200' },
    { label: '$200 - $500', value: '200-500' },
    { label: '$500+', value: '500-999999' },
  ];

  const guestOptions = [
    { label: '1 Guest', value: 1 },
    { label: '2 Guests', value: 2 },
    { label: '3 Guests', value: 3 },
    { label: '4+ Guests', value: 4 },
  ];

  const bedroomOptions = [
    { label: '1 Bedroom', value: 1 },
    { label: '2 Bedrooms', value: 2 },
    { label: '3 Bedrooms', value: 3 },
    { label: '4+ Bedrooms', value: 4 },
  ];

  const sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
        <FilterDropdown
          label="Type of place"
          options={propertyTypeOptions}
          value={propertyType}
          onChange={(value) => setPropertyType(value as string)}
        />
        <FilterDropdown
          label="Price"
          options={priceOptions}
          value={priceRange}
          onChange={(value) => setPriceRange(value as string)}
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
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        <FilterDropdown
          label="Sort by"
          options={sortOptions}
          value={sortBy}
          onChange={(value) => setSortBy(value as any)}
        />
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
          {isLoading ? 'Searching...' : `${sortedHotels.length} stays found`}
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
          {sortedHotels.length > 0 ? (
            sortedHotels.map(hotel => (
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
