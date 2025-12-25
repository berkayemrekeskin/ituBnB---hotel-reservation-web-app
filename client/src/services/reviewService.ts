import api from './api';

export interface CreateReviewData {
    reservation_id: string;
    property_id: string;
    rating: number;
    comment: string;
}

export interface Review {
    _id: { $oid: string } | string;
    reservation_id: string;
    user_id: string;
    property_id: string;
    rating: number;
    comment: string;
    created_at: { $date: number } | string;
    updated_at: { $date: number } | string;
}

export interface ReviewWithUser extends Review {
    user?: {
        name: string;
        username?: string;
        email?: string;
        avatar?: string;
    };
}

export interface ReviewStats {
    property_id: string;
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
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

    // Admin: Get all reviews
    getAllReviews: async () => {
        const response = await api.get('/api/reviews/');
        return response.data;
    },
};
