import api from './api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    name: string;
    username: string;
    email: string;
    password: string;
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post('/api/auth/login', credentials);
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }
        // Return both access_token and user_id
        return {
            access_token: response.data.access_token,
            user_id: response.data.user_id,
            role: response.data.role
        };
    },

    register: async (data: RegisterData) => {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    requestPasswordReset: async (username: string) => {
        const response = await api.post('/api/auth/forgot-password', { username });
        return response.data;
    },

    resetPassword: async (username: string, code: string, newPassword: string) => {
        const response = await api.post('/api/auth/reset-password', {
            username,
            code,
            new_password: newPassword
        });
        return response.data;
    },
};

