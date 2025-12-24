import api from './api';

export interface PaymentData {
    card_number: string;
    card_holder: string;
    expiry: string; // MM/YY format
    cvv: string;
    reservation_id: string;
    amount: number;
}

export interface PaymentResponse {
    message: string;
    transaction_id: string;
    payment_id: string;
    status: string;
}

export interface PaymentDetails {
    _id: string;
    reservation_id: string;
    card_last_four: string;
    amount: number;
    status: string;
    transaction_id: string;
    created_at: string;
}

export const paymentService = {
    processPayment: async (data: PaymentData): Promise<PaymentResponse> => {
        const response = await api.post('/api/payment/process', data);
        return response.data;
    },

    getPaymentById: async (paymentId: string): Promise<PaymentDetails> => {
        const response = await api.get(`/api/payment/${paymentId}`);
        return response.data;
    },

    getPaymentByReservation: async (reservationId: string): Promise<PaymentDetails> => {
        const response = await api.get(`/api/payment/reservation/${reservationId}`);
        return response.data;
    },
};
