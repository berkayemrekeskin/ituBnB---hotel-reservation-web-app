import api from './api';

export const userService = {
    // Get username by user ID (for fetching host username)
    getUsernameById: async (userId: string): Promise<string> => {
        const response = await api.get(`/users/id/${userId}/username`);
        return response.data.username;
    },

    // Get user by ID
    getUserById: async (userId: string) => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    },
};

export default userService;
