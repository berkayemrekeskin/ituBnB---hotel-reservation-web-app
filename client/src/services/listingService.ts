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
};
