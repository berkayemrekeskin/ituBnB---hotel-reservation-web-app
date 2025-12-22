import api from './api';

export interface CreateReviewData {
    reservation_id: string;
    property_id: string;
    rating: number;
    comment: string;
}

export const reviewService = {
    createReview: async (data: CreateReviewData) => {
        const response = await api.post('/api/reviews/', data);
        return response.data;
    },

    getPropertyReviews: async (propertyId: string) => {
        const response = await api.get(`/api/reviews/property/${propertyId}`);
        return response.data;
    },

    getPropertyStats: async (propertyId: string) => {
        const response = await api.get(`/api/reviews/property/${propertyId}/stats`);
        return response.data;
    },

    getReviewByReservation: async (reservationId: string) => {
        const response = await api.get(`/api/reviews/reservation/${reservationId}`);
        return response.data;
    },

    updateReview: async (id: string, data: { rating?: number; comment?: string }) => {
        const response = await api.put(`/api/reviews/${id}`, data);
        return response.data;
    },

    deleteReview: async (id: string) => {
        const response = await api.delete(`/api/reviews/${id}`);
        return response.data;
    },
};
