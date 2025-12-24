// Utility functions for transforming API data to frontend types
import { Hotel } from '../types';

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
 * Convert amenities array to object format
 */
const convertAmenitiesToObject = (amenities: any): any => {
    // If already an object, return it
    if (typeof amenities === 'object' && !Array.isArray(amenities)) {
        return amenities;
    }

    // If it's an array, convert to object with boolean values
    if (Array.isArray(amenities)) {
        const amenitiesObj: any = {};
        amenities.forEach((amenity: string) => {
            amenitiesObj[amenity] = true;
        });
        return amenitiesObj;
    }

    return {};
};

/**
 * Convert nearby array to object format
 */
const convertNearbyToObject = (nearby: any): any => {
    // If already an object, return it
    if (typeof nearby === 'object' && !Array.isArray(nearby)) {
        return nearby;
    }

    // If it's an array, convert to object with boolean values
    if (Array.isArray(nearby)) {
        const nearbyObj: any = {};
        nearby.forEach((item: string) => {
            nearbyObj[item] = true;
        });
        return nearbyObj;
    }

    return {};
};

/**
 * Transform backend listing data to frontend Hotel type
 */
export const transformListingToHotel = (listing: any): Hotel => {
    const details = listing.details || {};

    return {
        id: listing._id?.$oid || listing._id || listing.id,
        title: listing.title || `${extractType(listing)} in ${extractLocation(listing)}`,
        city: extractLocation(listing),
        property_type: extractType(listing),
        price: typeof listing.price === 'number' ? listing.price : (listing.price_per_night || 100),
        rating: listing.rating,
        reviews: listing.reviews || listing.review_count || 0,
        superhost: listing.superhost || false,
        images: listing.images || listing.photos || ['https://via.placeholder.com/400x300?text=No+Image'],
        description: listing.description || `Beautiful ${extractType(listing).toLowerCase()} in ${extractLocation(listing)}`,
        amenities: convertAmenitiesToObject(listing.amenities),
        details: {
            guests: details.guests || details.max_guests || 1,
            rooms: details.rooms || details.bedrooms || 1,
            beds: details.beds || 1,
            bathrooms: details.bathrooms || details.baths || 1,
        },
        nearby: convertNearbyToObject(listing.nearby),
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
