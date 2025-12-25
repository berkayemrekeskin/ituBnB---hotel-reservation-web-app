import api from './api';

export const userService = {
    // Get username by user ID (for fetching host username)
    getUsernameById: async (userId: string): Promise<string> => {
        const response = await api.get(`/api/users/id/${userId}/username`);
        return response.data.username;
    },

    // Get user by ID
    getUserById: async (userId: string) => {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },

    // Admin: Get all users
    getAllUsers: async () => {
        const response = await api.get('/api/users/');
        return response.data;
    },

    // Admin: Update user role to host
    makeUserHost: async (userId: string) => {
        const response = await api.post(`/api/users/${userId}/make-host`);
        return response.data;
    },

    // Admin: Update user role to regular user
    makeUserRegular: async (userId: string) => {
        const response = await api.post(`/api/users/${userId}/make-user`);
        return response.data;
    },

    // Admin: Delete user
    deleteUser: async (userId: string) => {
        const response = await api.delete(`/api/users/${userId}`);
        return response.data;
    },
};

export default userService;
