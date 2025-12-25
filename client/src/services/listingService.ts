import api from './api';
import { transformListingsToHotels, transformListingToHotel, transformAllListingsToHotels } from '../utils/dataTransformers';

export const listingService = {
    getAllListings: async () => {
        const response = await api.get('/api/listings/');
        return transformListingsToHotels(response.data);
    },

    getListingById: async (id: string) => {
        const response = await api.get(`/api/listings/${id}`);
        return transformListingToHotel(response.data);
    },

    getListingByIdWithoutTransform: async (id: string) => {
        const response = await api.get(`/api/listings/${id}`);
        return response.data;
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

    getHostListings: async (hostId: string) => {
        const response = await api.get(`/api/listings/host/${hostId}`);
        return transformAllListingsToHotels(response.data);
    },

    getListingHostUsername: async (listingId: string) => {
        const response = await api.get(`/api/listings/${listingId}/host/username`);
        return response.data.username;
    },

    // Admin methods
    getPendingListings: async () => {
        const response = await api.get('/api/listings/admin/pending');
        return transformAllListingsToHotels(response.data);  // Don't filter pending listings
    },

    approveListing: async (id: number | string) => {
        const response = await api.post('/api/listings/admin/approve-listing', { listing_id: id });
        return response.data;
    },

    rejectListing: async (id: number | string) => {
        const response = await api.post('/api/listings/admin/reject-listing', { listing_id: id });
        return response.data;
    },
};
