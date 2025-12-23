// Utility functions for transforming API data to frontend types
import { Hotel } from '../types';

/**
 * Extract price from various formats
 */
const extractPrice = (listing: any): number => {
    // If price_per_night is a number, use it
    if (typeof listing.price_per_night === 'number') {
        return listing.price_per_night;
    }

    // If price is a number, use it
    if (typeof listing.price === 'number') {
        return listing.price;
    }

    // If price is an object with min/max, use the average or available value
    if (typeof listing.price === 'object' && listing.price !== null) {
        const priceObj = listing.price;
        const min = priceObj.min_per_night;
        const max = priceObj.max_per_night;

        if (min && max) {
            return (min + max) / 2;
        }
        if (max) {
            return max;
        }
        if (min) {
            return min;
        }
    }

    // Default fallback
    return 100;
};

/**
 * Extract amenities from object format to array of strings
 */
const extractAmenities = (listing: any): string[] => {
    const amenitiesObj = listing.amenities;

    // If already an array, return it
    if (Array.isArray(amenitiesObj)) {
        return amenitiesObj;
    }

    // If it's an object, extract keys where value is true
    if (typeof amenitiesObj === 'object' && amenitiesObj !== null) {
        return Object.keys(amenitiesObj)
            .filter(key => amenitiesObj[key] === true)
            .map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }

    return [];
};

/**
 * Extract location from city field or location field
 */
const extractLocation = (listing: any): string => {
    if (listing.location) return listing.location;
    if (listing.city) {
        return listing.city.charAt(0).toUpperCase() + listing.city.slice(1);
    }
    return 'Unknown Location';
};

/**
 * Extract property type
 */
const extractType = (listing: any): string => {
    if (listing.type) return listing.type;
    if (listing.property_type) {
        return listing.property_type.charAt(0).toUpperCase() + listing.property_type.slice(1);
    }
    return 'Entire home';
};

/**
 * Transform backend listing data to frontend Hotel type
 */
export const transformListingToHotel = (listing: any): Hotel => {
    const details = listing.details || {};

    return {
        id: listing._id?.$oid || listing._id || listing.id,
        title: listing.title || `${extractType(listing)} in ${extractLocation(listing)}`,
        location: extractLocation(listing),
        type: extractType(listing),
        guests: details.guests || details.max_guests || 1,
        bedrooms: details.rooms || details.bedrooms || 1,
        beds: details.beds || 1,
        baths: details.bathrooms || details.baths || 1,
        price: extractPrice(listing),
        rating: listing.rating || 4.5,
        reviews: listing.reviews || listing.review_count || 0,
        superhost: listing.superhost || false,
        images: listing.images || listing.photos || ['https://via.placeholder.com/400x300?text=No+Image'],
        amenities: extractAmenities(listing),
        description: listing.description || `Beautiful ${extractType(listing).toLowerCase()} in ${extractLocation(listing)}`,
        nearby: listing.nearby,
    };
};

/**
 * Transform array of backend listings to frontend Hotel array
 * Only includes approved listings
 */
export const transformListingsToHotels = (listings: any[]): Hotel[] => {
    return listings
        .filter(listing => listing.status === 'approved')  // Only show approved listings
        .map(transformListingToHotel);
};

/**
 * Transform array of backend listings to frontend Hotel array
 * Does NOT filter by status - used for admin views
 */
export const transformAllListingsToHotels = (listings: any[]): Hotel[] => {
    return listings.map(transformListingToHotel);
};
