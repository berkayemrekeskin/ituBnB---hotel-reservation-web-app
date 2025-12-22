import api from './api';
import { transformListingsToHotels, transformListingToHotel } from '../utils/dataTransformers';

export const listingService = {
    getAllListings: async () => {
        const response = await api.get('/api/listings/');
        return transformListingsToHotels(response.data);
    },

    getListingById: async (id: string) => {
        const response = await api.get(`/api/listings/${id}`);
        return transformListingToHotel(response.data);
    },

    createListing: async (data: any) => {
        const response = await api.post('/api/listings/', data);
        return response.data;
    },

    updateListing: async (id: string, data: any) => {
        const response = await api.put(`/api/listings/${id}`, data);
        return response.data;
    },

    deleteListing: async (id: string) => {
        const response = await api.delete(`/api/listings/${id}`);
        return response.data;
    },

    // Admin methods (Mock implementations for frontend dev)
    getPendingListings: async () => {
        // TODO: Replace with actual API call: await api.get('/api/admin/listings/pending');
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 101,
                        title: "Cozy Mountain Cabin",
                        location: "Aspen, CO",
                        type: "Cabin",
                        guests: 4,
                        bedrooms: 2,
                        beds: 2,
                        baths: 1,
                        price: 250,
                        rating: 0,
                        reviews: 0,
                        superhost: false,
                        images: ["https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
                        amenities: ["Wifi", "Kitchen", "Fireplace"],
                        description: "A beautiful cabin in the mountains, perfect for a winter getaway.",
                        status: 'pending'
                    },
                    {
                        id: 102,
                        title: "Modern City Apartment",
                        location: "New York, NY",
                        type: "Apartment",
                        guests: 2,
                        bedrooms: 1,
                        beds: 1,
                        baths: 1,
                        price: 180,
                        rating: 0,
                        reviews: 0,
                        superhost: false,
                        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
                        amenities: ["Wifi", "Air conditioning", "Elevator"],
                        description: "Stylish apartment in the heart of Manhattan.",
                        status: 'pending'
                    }
                ]);
            }, 800);
        });
    },

    approveListing: async (id: number | string) => {
        // TODO: Replace with actual API call: await api.post(`/api/admin/listings/${id}/approve`);
        console.log(`Approving listing ${id}`);
        return Promise.resolve({ success: true });
    },

    rejectListing: async (id: number | string) => {
        // TODO: Replace with actual API call: await api.post(`/api/admin/listings/${id}/reject`);
        console.log(`Rejecting listing ${id}`);
        return Promise.resolve({ success: true });
    },
};
