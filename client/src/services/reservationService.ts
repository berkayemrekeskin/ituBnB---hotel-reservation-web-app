import api from './api';

export interface CreateReservationData {
    user_id: string;
    host_id?: string; // Optional - backend can derive from listing
    listing_id: string;
    start_date: string;
    end_date: string;
    guests: number;
    total_price: number;
    status?: string; // Optional - for status updates
}

export const reservationService = {
    createReservation: async (data: CreateReservationData) => {
        const response = await api.post('/api/reservations/', data);
        return response.data;
    },

    getUserReservations: async (userId: string) => {
        const response = await api.get(`/api/reservations/user/${userId}`);
        return response.data;
    },

    getReservationById: async (id: string) => {
        const response = await api.get(`/api/reservations/${id}`);
        return response.data;
    },

    cancelReservation: async (id: string) => {
        const response = await api.post(`/api/reservations/${id}/cancel`);
        return response.data;
    },


    updateReservation: async (id: string, data: Partial<CreateReservationData>) => {
        const response = await api.put(`/api/reservations/${id}`, data);
        return response.data;
    },

    // Host-specific methods
    getHostReservations: async (hostId: string) => {
        const response = await api.get(`/api/reservations/host/${hostId}`);
        return response.data;
    },

    approveReservation: async (id: string) => {
        const response = await api.post(`/api/reservations/${id}/accept`);
        return response.data;
    },

    declineReservation: async (id: string) => {
        const response = await api.post(`/api/reservations/${id}/decline`);
        return response.data;
    },
};

